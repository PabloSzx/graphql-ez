import { documentParamsToURIParams } from '@graphql-ez/utils/clientURI';
import { cleanObject } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import { getURLWebsocketVersion } from '@graphql-ez/utils/url';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type {} from 'eventsource';
import { ExecutionResult, print } from 'graphql';
import type {} from 'graphql-ws';
import type { IncomingHttpHeaders } from 'http';
import type {} from 'subscriptions-transport-ws-envelop';
import { Client } from 'undici';
import type {} from 'undici/types/dispatcher';
import { createSSESubscription } from './sse';
import { createStreamHelper } from './stream';
import type { SubscribeOptions } from './types';
import { createUploadQuery } from './upload';
import type { GraphQLWSClientOptions } from './websockets/graphql-ws';
import type { SubscriptionsTransportClientOptions } from './websockets/subscriptions-transport';
export interface EZClientOptions {
  endpoint: string;
  headers?: IncomingHttpHeaders;
  graphQLWSClientOptions?: Partial<GraphQLWSClientOptions>;
  subscriptionsTransportClientOptions?: SubscriptionsTransportClientOptions;
}

export async function getStringFromStream(stream: import('stream').Readable): Promise<string> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf-8');
}

export async function getJSONFromStream<T>(stream: import('stream').Readable): Promise<T> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
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

  function getHeaders(headersArg: IncomingHttpHeaders | undefined) {
    return cleanObject({
      ...headers,
      ...headersArg,
    });
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
    sseSubscribe: createSSESubscription(endpointHref, getHeaders),
    client,
    headers,
    setHeaders(headersToAssign: IncomingHttpHeaders) {
      Object.assign(headers, headersToAssign);
    },
    uploadQuery: createUploadQuery(endpointHref, getHeaders, queryPost),
  };
}
