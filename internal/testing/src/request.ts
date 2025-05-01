import { DocumentNode, ExecutionResult, print } from 'graphql';

import { documentParamsToURIParams } from '@graphql-ez/utils/clientURI';
import { LazyPromise } from '@graphql-ez/utils/promise';

import { TearDownPromises } from './common';

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { IncomingHttpHeaders } from 'http';
import type { Dispatcher } from 'undici';

export type RequestOptions = Dispatcher.RequestOptions;

export type { TypedDocumentNode };

export async function getRequestPool(port: number, path = '/graphql') {
  const { Pool } = await import('undici');
  const address = `http://localhost:${port}`;
  const addressWithoutProtocol = `localhost:${port}`;
  const requestPool = new Pool(address, {
    connections: 5,
    bodyTimeout: 0,
  });

  TearDownPromises.push(LazyPromise(() => requestPool.close()));

  return {
    address,
    addressWithoutProtocol,
    async request(options: Omit<RequestOptions, 'origin'>) {
      const { body } = await requestPool.request({ ...options, origin: address });

      return body.text();
    },

    async requestRaw(options: Omit<RequestOptions, 'origin'>) {
      const { body, ...rest } = await requestPool.request({ ...options, origin: address });

      return { body: await body.text(), ...rest };
    },
    async query<TData, TVariables = {}>(
      document?: TypedDocumentNode<TData, TVariables> | string,
      options?: {
        variables?: TVariables;
        headers?: IncomingHttpHeaders;
        extensions?: Record<string, unknown>;
        operationName?: string;
        /**
         * @default "POST"
         */
        method?: 'POST' | 'GET';
      }
    ): Promise<ExecutionResult<TData> & { http: { statusCode: number; headers: IncomingHttpHeaders } }> {
      const { variables, headers: headersArg, extensions, operationName, method = 'POST' } = options || {};
      const {
        body,
        headers: { date, ...headers },
        statusCode,
      } = await requestPool.request(
        method === 'POST'
          ? {
              origin: address,
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                ...headersArg,
              },
              body: JSON.stringify({
                query: typeof document === 'string' ? document : document && print(document),
                variables,
                extensions,
                operationName,
              }),
              path,
            }
          : {
              origin: address,
              method: 'GET',
              headers: {
                'content-type': 'application/json',
                ...headersArg,
              },
              path: path + documentParamsToURIParams({ query: document || '', extensions, operationName, variables }),
            }
      );

      const contentType = headers['content-type'];
      const contentTypeString = Array.isArray(contentType) ? contentType[0] : contentType;

      if (!contentTypeString?.startsWith('application/json')) {
        console.error({
          body: await body.text(),
          headers,
        });
        throw Error('Unexpected content type received: ' + headers['content-type']);
      }

      const responseBody = await body.json();
      return Object.assign({}, responseBody, { http: { statusCode, headers } });
    },
    async batchedQueries(
      queries: Array<{
        query?: DocumentNode | string;
        variables?: Record<string, unknown>;
        extensions?: Record<string, unknown>;
        operationName?: string;
      }>,
      options?: { headers?: IncomingHttpHeaders }
    ): Promise<{
      result: Array<ExecutionResult<Record<string, any>>>;
      http: { statusCode: number; headers: IncomingHttpHeaders };
    }> {
      const {
        body,
        headers: { date, ...headers },
        statusCode,
      } = await requestPool.request({
        origin: address,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(
          queries.map(({ query, variables, extensions, operationName }) => {
            return {
              query: typeof query === 'string' ? query : query && print(query),
              variables,
              extensions,
              operationName,
            };
          })
        ),
        path,
      });

      const contentType = headers['content-type'];
      const contentTypeString = Array.isArray(contentType) ? contentType[0] : contentType;

      if (!contentTypeString?.startsWith('application/json')) {
        console.error({
          body: await body.text(),
          headers,
        });
        throw Error('Unexpected content type received: ' + headers['content-type']);
      }

      const result = (await body.json()) as ExecutionResult<Record<string, any>>[];

      return { result, http: { statusCode, headers } };
    },
  };
}
