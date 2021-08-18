import EventSource, { EventSourceInitDict } from 'eventsource';
import { stripIgnoredCharacters, print, ExecutionResult } from 'graphql';

import { createDeferredPromise, DeferredPromise } from 'graphql-ez/utils/promise';

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { SubscribeOptions, SubscribeFunction } from './types';
export function createSSESubscription(href: string) {
  const subscribe: SubscribeFunction = function subscribe<
    TData,
    TVariables extends Record<string, unknown> = {},
    TExtensions extends Record<string, unknown> = {}
  >(
    document: string | TypedDocumentNode<TData, TVariables>,
    { variables, extensions, operationName, onData }: SubscribeOptions<TData, TVariables, TExtensions, EventSourceInitDict> = {}
  ) {
    const queryString = typeof document === 'string' ? document : print(document);

    const eventSource = new EventSource(
      `${href}?query=${encodeURIComponent(stripIgnoredCharacters(queryString))}${
        variables ? '&variables=' + encodeURIComponent(JSON.stringify(variables)) : ''
      }${extensions ? '&extensions=' + encodeURIComponent(JSON.stringify(extensions)) : ''}${
        operationName ? '&operationName=' + encodeURIComponent(operationName) : ''
      }`
    );

    let deferValuePromise: DeferredPromise<ExecutionResult<any> | null> | null = createDeferredPromise();

    const done = new Promise<void>((resolve, reject) => {
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
      unsubscribe() {
        eventSource.close();
      },
      done,
      iterator,
    };
  };

  return subscribe;
}
