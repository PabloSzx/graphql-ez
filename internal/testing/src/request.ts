import { ExecutionResult, print } from 'graphql';
import { Readable } from 'stream';
import { Pool } from 'undici';

import { LazyPromise } from '@graphql-ez/utils/promise';
import { documentParamsToURIParams } from '@graphql-ez/utils/clientURI';

import { TearDownPromises } from './common';

import type { RequestOptions } from 'undici/types/dispatcher';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { IncomingHttpHeaders } from 'http';

export type { RequestOptions, TypedDocumentNode };

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

export function getRequestPool(port: number, path = '/graphql') {
  const address = `http://127.0.0.1:${port}`;
  const addressWithoutProtocol = `127.0.0.1:${port}`;
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

      return getStringFromStream(body);
    },

    async requestRaw(options: Omit<RequestOptions, 'origin'>) {
      const { body, ...rest } = await requestPool.request({ ...options, origin: address });

      return { body: getStringFromStream(body), ...rest };
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
      const { body, headers, statusCode } = await requestPool.request(
        method === 'POST'
          ? {
              origin: address,
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                ...headersArg,
              },
              body: Readable.from(
                JSON.stringify({
                  query: typeof document === 'string' ? document : document && print(document),
                  variables,
                  extensions,
                  operationName,
                }),
                {
                  objectMode: false,
                }
              ),
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

      if (!headers['content-type']?.startsWith('application/json')) {
        console.error({
          body: await getStringFromStream(body),
          headers,
        });
        throw Error('Unexpected content type received: ' + headers['content-type']);
      }

      return { ...(await getJSONFromStream(body)), http: { statusCode, headers } };
    },
  };
}
