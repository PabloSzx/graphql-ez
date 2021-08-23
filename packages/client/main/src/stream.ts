import assert from 'assert';
import { print } from 'graphql';
import { PassThrough } from 'stream';

import { createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';

import type { Client } from 'undici';

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { IncomingHttpHeaders } from 'http';

export function createStreamHelper(
  client: Client,
  path: string,
  getHeaders: (headers: IncomingHttpHeaders | undefined) => Record<string, string>
) {
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
    const queryString = typeof document === 'string' ? document : print(document);

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

    const done = client.stream(
      {
        path,
        method: 'POST',
        body: JSON.stringify({ query: queryString, variables, extensions, operationName }),
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
    };
  };
}
