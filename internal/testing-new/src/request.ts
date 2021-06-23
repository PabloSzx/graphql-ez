import { ExecutionResult, print } from 'graphql';
import { Readable } from 'stream';
import { Pool } from 'undici';

import { LazyPromise } from '@graphql-ez/core-utils/promise';

import { TearDownPromises } from './common';

import type { RequestOptions } from 'undici/types/dispatcher';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

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
  const requestPool = new Pool(address, {
    connections: 5,
  });

  TearDownPromises.push(LazyPromise(() => requestPool.close()));

  return {
    address,
    async request(options: Omit<RequestOptions, 'origin'>) {
      const { body } = await requestPool.request({ ...options, origin: address });

      return getStringFromStream(body);
    },

    async requestRaw(options: Omit<RequestOptions, 'origin'>) {
      const { body, ...rest } = await requestPool.request({ ...options, origin: address });

      return { body: getStringFromStream(body), ...rest };
    },
    async query<TData, TVariables>(
      document: TypedDocumentNode<TData, TVariables> | string,
      variables?: TVariables
    ): Promise<ExecutionResult<TData>> {
      const { body, headers } = await requestPool.request({
        origin: address,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: Readable.from(JSON.stringify({ query: typeof document === 'string' ? document : print(document), variables }), {
          objectMode: false,
        }),
        path,
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
  };
}
