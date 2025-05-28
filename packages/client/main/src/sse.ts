import { createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { ExecutionResult, stripIgnoredCharacters } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import type { EventSourceFetchInit } from './deps.js';
import type { SubscribeFunction, SubscribeOptions } from './types';
import { getQueryString, incomingHeadersToHeadersInit, lazyDeps } from './utils';

export type SubscribeSSE = SubscribeFunction<EventSourceFetchInit & { headers?: Partial<IncomingHttpHeaders> }>;

export function createSSESubscription(
  href: string,
  getHeaders: (headers: IncomingHttpHeaders | undefined) => IncomingHttpHeaders
) {
  const subscribe: SubscribeSSE = function subscribe<
    TData,
    TVariables extends Record<string, unknown> = {},
    TExtensions extends Record<string, unknown> = {},
  >(
    document: string | TypedDocumentNode<TData, TVariables>,
    {
      variables,
      extensions,
      operationName,
      onData,
      headers,
      ...rest
    }: SubscribeOptions<TData, TVariables, TExtensions, EventSourceFetchInit> = {}
  ) {
    let deferValuePromise: DeferredPromise<ExecutionResult<any> | null> | null = createDeferredPromise();

    let eventSource: import('./deps').EventSource | undefined;

    const done = new Promise<void>(async (resolve, reject) => {
      const { EventSource } = await lazyDeps;
      const url = new URL(href);

      url.searchParams.set('query', stripIgnoredCharacters(getQueryString(document)));
      if (variables) url.searchParams.set('variables', JSON.stringify(variables));
      if (extensions) url.searchParams.set('extensions', JSON.stringify(extensions));
      if (operationName) url.searchParams.set('operationName', operationName);

      eventSource = new EventSource(url.toString(), {
        ...rest,
        fetch() {
          return fetch(url.toString(), {
            ...rest,
            headers: incomingHeadersToHeadersInit(getHeaders(headers)),
          });
        },
      });
      try {
        eventSource.onerror = evt => {
          console.error(evt);
          reject(new Error(evt.message && evt.code ? `${evt.message} (${evt.code})` : evt.message || 'Unknown error'));
        };
        eventSource.onmessage = evt => {
          const value = JSON.parse(evt.data);
          onData?.(value);
          deferValuePromise?.resolve(value);
          deferValuePromise = createDeferredPromise();
          resolve();
        };
      } catch (err) {
        reject(err);
      }
    }).catch(error => {
      deferValuePromise?.reject(error);
      deferValuePromise = null;
    });

    async function* iteratorGenerator() {
      while (deferValuePromise?.promise) {
        const value = await deferValuePromise.promise;

        if (value != null) {
          yield value;
        }
      }
    }

    const iterator = iteratorGenerator();

    return {
      async unsubscribe() {
        if (!eventSource) await done;

        eventSource?.close();
      },
      done,
      iterator,
    };
  };

  return subscribe;
}
