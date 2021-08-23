import EventSource, { EventSourceInitDict } from 'eventsource';
import { ExecutionResult, print, stripIgnoredCharacters } from 'graphql';

import { createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { SubscribeOptions, SubscribeFunction } from './types';
import type { IncomingHttpHeaders } from 'http';

export function createLegacySSESubscription(
  href: string,
  getHeaders: (headers: IncomingHttpHeaders | undefined) => Record<string, string>
) {
  const subscribe: SubscribeFunction<EventSourceInitDict> = function subscribe<
    TData,
    TVariables extends Record<string, unknown> = {},
    TExtensions extends Record<string, unknown> = {}
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
    const queryString = typeof document === 'string' ? document : print(document);

    const eventSource = new EventSource(
      `${href}?query=${encodeURIComponent(stripIgnoredCharacters(queryString))}${
        variables ? '&variables=' + encodeURIComponent(JSON.stringify(variables)) : ''
      }${extensions ? '&extensions=' + encodeURIComponent(JSON.stringify(extensions)) : ''}${
        operationName ? '&operationName=' + encodeURIComponent(operationName) : ''
      }`,
      {
        ...rest,
        headers: getHeaders(headers),
      }
    );

    let deferValuePromise: DeferredPromise<ExecutionResult<any> | null> | null = createDeferredPromise();

    const done = new Promise<void>((resolve, reject) => {
      eventSource.onerror = evt => {
        console.error(evt);
        reject(evt.data);
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
