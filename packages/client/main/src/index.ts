import { ExecutionResult, print, stripIgnoredCharacters } from 'graphql';
import { Client } from 'undici';
import { getURLWebsocketVersion } from 'graphql-ez/utils/url';
import { LazyPromise } from 'graphql-ez/utils/promise';

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { IncomingHttpHeaders } from 'http';

import type { SubscribeOptions } from './types';
import { createStreamHelper } from './stream';
import { createSSESubscription } from './sse';

export interface EZClientOptions {
  endpoint: string;
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

export function EZClient(options: EZClientOptions) {
  const endpointUrl = new URL(options.endpoint);

  const websocketEndpoint = getURLWebsocketVersion(options.endpoint).href;

  const endpointHref = endpointUrl.href;
  const endpointOrigin = endpointUrl.origin;

  const endpointPathname = endpointUrl.pathname;

  const client = new Client(endpointOrigin);

  const graphqlWS = LazyPromise(async () => {
    const { createGraphQLWSWebsocketsClient } = await import('./websockets/graphql-ws');

    return createGraphQLWSWebsocketsClient(websocketEndpoint);
  });

  const legacyTransport = LazyPromise(async () => {
    const { createSubscriptionsTransportWebsocketsClient } = await import('./websockets/subscriptions-transport');

    return createSubscriptionsTransportWebsocketsClient(websocketEndpoint);
  });

  return {
    async query<TData, TVariables = {}>(
      document: TypedDocumentNode<TData, TVariables> | string,
      {
        variables,
        headers: headersArg,
        method = 'POST',
      }: {
        variables?: TVariables;
        headers?: IncomingHttpHeaders;
        /**
         * @default "POST"
         */
        method?: 'GET' | 'POST';
      } = {}
    ): Promise<ExecutionResult<TData>> {
      const queryString = typeof document === 'string' ? document : print(document);
      const { body, headers } = await client.request(
        method === 'GET'
          ? {
              method: 'GET',
              headers: headersArg,
              path: `${endpointPathname}?query=${encodeURIComponent(stripIgnoredCharacters(queryString))}${
                variables ? '&variables=' + encodeURIComponent(JSON.stringify(variables)) : ''
              }`,
            }
          : {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                ...headersArg,
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
    },
    async mutation<TData, TVariables = {}>(
      document: TypedDocumentNode<TData, TVariables> | string,
      {
        variables,
        headers: headersArg,
      }: {
        variables?: TVariables;
        headers?: IncomingHttpHeaders;
      } = {}
    ) {
      const queryString = typeof document === 'string' ? document : print(document);

      const { body, headers } = await client.request({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...headersArg,
        },
        body: JSON.stringify({ query: queryString, variables }),
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
    },
    websockets: {
      async subscribe<TData, TVariables extends Record<string, unknown> = {}>(
        document: TypedDocumentNode<TData, TVariables> | string,
        options?: SubscribeOptions<TData, TVariables>
      ) {
        const { subscribe } = await graphqlWS;

        return subscribe(document, options);
      },
      client: LazyPromise(() => graphqlWS.then(v => v.client)),
      legacy: {
        async subscribe<TData, TVariables extends Record<string, unknown> = {}>(
          document: TypedDocumentNode<TData, TVariables> | string,
          options?: SubscribeOptions<TData, TVariables>
        ) {
          const { subscribe } = await legacyTransport;

          return subscribe(document, options);
        },
        client: LazyPromise(() => legacyTransport.then(v => v.client)),
      },
    },
    stream: createStreamHelper(client, endpointPathname),
    sseSubscribe: createSSESubscription(endpointHref),
  };
}
