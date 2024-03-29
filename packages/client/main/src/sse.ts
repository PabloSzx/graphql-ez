import { createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { ExecutionResult, stripIgnoredCharacters } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import type { EventSourceInitDict } from './deps.js';
import type { SubscribeFunction, SubscribeOptions } from './types';
import { getQueryString, lazyDeps } from './utils';

export type SubscribeSSE = SubscribeFunction<EventSourceInitDict & { headers?: Partial<IncomingHttpHeaders> }>;

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
    }: SubscribeOptions<TData, TVariables, TExtensions, EventSourceInitDict> = {}
  ) {
    let deferValuePromise: DeferredPromise<ExecutionResult<any> | null> | null = createDeferredPromise();

    let eventSource: import('./deps').EventSource | undefined;

    const done = new Promise<void>(async (resolve, reject) => {
      const { EventSource } = await lazyDeps;
      eventSource = new EventSource(
        `${href}?query=${encodeURIComponent(stripIgnoredCharacters(getQueryString(document)))}${
          variables ? '&variables=' + encodeURIComponent(JSON.stringify(variables)) : ''
        }${extensions ? '&extensions=' + encodeURIComponent(JSON.stringify(extensions)) : ''}${
          operationName ? '&operationName=' + encodeURIComponent(operationName) : ''
        }`,
        {
          ...rest,
          headers: getHeaders(headers as IncomingHttpHeaders),
        }
      );
      try {
        eventSource.onerror = evt => {
          console.error(evt);
          reject(evt.data);
          // deferValuePromise?.reject(value)
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
