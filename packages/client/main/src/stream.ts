import { createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import assert from 'assert';
import type { IncomingHttpHeaders } from 'http';
import { PassThrough } from 'stream';
import type { Pool, Dispatcher } from 'undici';
import { getQueryString } from './utils';

export type Stream = <TData, TVariables extends Record<string, unknown> = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: {
    variables?: TVariables;
    headers?: IncomingHttpHeaders;
    extensions?: Record<string, unknown>;
    operationName?: string;
  }
) => {
  iterator: AsyncGenerator<string, void, unknown>;
  opaque: PassThrough;
  done: Promise<Dispatcher.StreamData>;
  stop: () => void;
};

export function createStreamHelper(
  pool: Pool,
  path: string,
  getHeaders: (headers: IncomingHttpHeaders | undefined) => IncomingHttpHeaders
): Stream {
  return function stream<TData, TVariables extends Record<string, unknown> = {}>(
    document: TypedDocumentNode<TData, TVariables> | string,
    {
      variables,
      headers: headersArg,
      extensions,
      operationName,
    }: {
      variables?: TVariables;
      headers?: IncomingHttpHeaders;
      extensions?: Record<string, unknown>;
      operationName?: string;
    } = {}
  ) {
    let deferValuePromise: DeferredPromise<string | null> | null = createDeferredPromise();

    async function* iteratorGenerator() {
      while (deferValuePromise?.promise) {
        const value = await deferValuePromise.promise;

        if (value != null) {
          yield value;
        }
      }
    }

    const iterator = iteratorGenerator();

    const opaque = new PassThrough().setEncoding('utf8');

    const stop = () => {
      deferValuePromise?.resolve(null);
      deferValuePromise = null;
      opaque.end();
    };

    const done = pool.stream(
      {
        path,
        method: 'POST',
        body: JSON.stringify({ query: getQueryString(document), variables, extensions, operationName }),
        headers: {
          'content-type': 'application/json',
          ...getHeaders(headersArg),
        },
        opaque,
      },
      ({ opaque }) => {
        assert(opaque instanceof PassThrough);

        (async () => {
          try {
            for await (const chunk of opaque) {
              deferValuePromise?.resolve(chunk);
              deferValuePromise = createDeferredPromise();
            }
          } catch (err) {
            deferValuePromise?.reject(err);
            deferValuePromise = null;
          }
          deferValuePromise?.resolve(null);
          deferValuePromise = null;
        })();

        return opaque;
      }
    );

    assert(opaque instanceof PassThrough);

    return {
      iterator,
      opaque,
      done,
      stop,
    };
  };
}
