import { documentParamsToURIParams } from '@graphql-ez/utils/clientURI';
import { cleanObject } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import { getURLWebsocketVersion } from '@graphql-ez/utils/url';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { ExecutionResult, print } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import { Client } from 'undici';
import { createNewSSESubscription } from './new-sse';
import { createLegacySSESubscription } from './old-sse';
import { createStreamHelper } from './stream';
import type { SubscribeOptions } from './types';
import { createUploadQuery } from './upload';
import type { GraphQLWSClientOptions } from './websockets/graphql-ws';
import type { SubscriptionsTransportClientOptions } from './websockets/subscriptions-transport';

export interface EZClientOptions {
  endpoint: string;
  newSSEEndpoint: string | undefined;
  headers?: IncomingHttpHeaders;
  graphQLWSClientOptions?: Partial<GraphQLWSClientOptions>;
  subscriptionsTransportClientOptions?: SubscriptionsTransportClientOptions;
}

export function getStringFromStream(stream: import('stream').Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    stream.on('data', chunk => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      try {
        resolve(Buffer.concat(chunks).toString('utf-8'));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export function getJSONFromStream<T>(stream: import('stream').Readable): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    stream.on('data', chunk => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export type QueryFunctionPostGet = <TData, TVariables = {}, TExtensions = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: {
    variables?: TVariables;
    headers?: IncomingHttpHeaders;
    /**
     * @default "POST"
     */
    method?: 'GET' | 'POST';
    extensions?: Record<string, unknown>;
    operationName?: string;
  }
) => Promise<ExecutionResult<TData, TExtensions>>;

export type QueryFunctionPost = <TData, TVariables = {}, TExtensions = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: {
    variables?: TVariables;
    headers?: IncomingHttpHeaders;
    extensions?: Record<string, unknown>;
    operationName?: string;
  }
) => Promise<ExecutionResult<TData, TExtensions>>;

export function EZClient(options: EZClientOptions) {
  const endpointUrl = new URL(options.endpoint);

  const websocketEndpoint = getURLWebsocketVersion(options.endpoint).href;

  const endpointHref = endpointUrl.href;
  const endpointOrigin = endpointUrl.origin;

  const endpointPathname = endpointUrl.pathname;

  const client = new Client(endpointOrigin);

  const graphqlWS = LazyPromise(async () => {
    const { createGraphQLWSWebsocketsClient } = await import('./websockets/graphql-ws');

    return createGraphQLWSWebsocketsClient(websocketEndpoint, options.graphQLWSClientOptions);
  });

  const legacyTransport = LazyPromise(async () => {
    const { createSubscriptionsTransportWebsocketsClient } = await import('./websockets/subscriptions-transport');

    return createSubscriptionsTransportWebsocketsClient(websocketEndpoint, options.subscriptionsTransportClientOptions);
  });

  const headers = cleanObject(options.headers);

  function getHeaders(headersArg: IncomingHttpHeaders | undefined): Record<string, string> {
    const newHeaders = cleanObject({
      ...headers,
      ...headersArg,
    }) as Record<string, string>;

    for (const key in newHeaders) {
      if (typeof newHeaders[key] !== 'string') delete newHeaders[key];
    }

    return newHeaders;
  }

  const query: QueryFunctionPostGet = async function query(
    document,
    { variables, headers: headersArg, method = 'POST', extensions, operationName } = {}
  ) {
    const queryString = typeof document === 'string' ? document : print(document);
    const { body, headers } = await client.request(
      method === 'GET'
        ? {
            method: 'GET',
            headers: getHeaders(headersArg),
            path: endpointPathname + documentParamsToURIParams({ query: queryString, extensions, operationName, variables }),
          }
        : {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...getHeaders(headersArg),
            },
            body: JSON.stringify({ query: queryString, variables }),
            path: endpointPathname,
          }
    );

    if (!headers['content-type']?.startsWith('application/json')) {
      console.error({
        body: await getStringFromStream(body),
        headers,
      });
      throw Error('Unexpected content type received: ' + headers['content-type']);
    }

    return getJSONFromStream(body);
  };

  const queryPost: QueryFunctionPost = async function queryPost(
    document,
    { variables, headers: headersArg, extensions, operationName } = {}
  ) {
    const queryString = typeof document === 'string' ? document : print(document);

    const { body, headers } = await client.request({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...getHeaders(headersArg),
      },
      body: JSON.stringify({ query: queryString, variables, operationName, extensions }),
      path: endpointPathname,
    });

    if (!headers['content-type']?.startsWith('application/json')) {
      console.error({
        body: await getStringFromStream(body),
        headers,
      });
      throw Error('Unexpected content type received: ' + headers['content-type']);
    }

    return getJSONFromStream(body);
  };

  return {
    query,
    mutation: queryPost,
    websockets: {
      async subscribe<TData, TVariables extends Record<string, unknown> = {}>(
        document: TypedDocumentNode<TData, TVariables> | string,
        options?: SubscribeOptions<TData, TVariables>
      ) {
        const { subscribe } = await graphqlWS;

        return subscribe(document, { ...options, headers: getHeaders(options?.headers) });
      },
      client: LazyPromise(() => graphqlWS.then(v => v.client)),
      legacy: {
        async subscribe<TData, TVariables extends Record<string, unknown> = {}>(
          document: TypedDocumentNode<TData, TVariables> | string,
          options?: SubscribeOptions<TData, TVariables>
        ) {
          const { subscribe } = await legacyTransport;

          return subscribe(document, { ...options, headers: getHeaders(options?.headers) });
        },
        client: LazyPromise(() => legacyTransport.then(v => v.client)),
      },
    },
    stream: createStreamHelper(client, endpointPathname, getHeaders),
    sseSubscribe: createLegacySSESubscription(endpointHref, getHeaders),
    newSSESubscribe: createNewSSESubscription(options.newSSEEndpoint, getHeaders),
    client,
    headers,
    setHeaders(headersToAssign: IncomingHttpHeaders) {
      Object.assign(headers, headersToAssign);
    },
    uploadQuery: createUploadQuery(endpointHref, getHeaders, queryPost),
  };
}
