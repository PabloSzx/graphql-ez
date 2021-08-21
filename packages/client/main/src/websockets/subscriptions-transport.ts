import { print, ExecutionResult } from 'graphql';
import {
  ClientOptions as SubscriptionsTransportClientOptions,
  SubscriptionClient as SubscriptionsTransportClient,
} from 'subscriptions-transport-ws-envelop/client';
import { isDocumentNode } from '@graphql-tools/utils';

import ws from 'isomorphic-ws';
import { createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';

import type { SubscribeFunction } from '../types';

export type { SubscriptionsTransportClientOptions };

export function createSubscriptionsTransportWebsocketsClient(
  wsEndpoint: string,
  options: SubscriptionsTransportClientOptions = {}
) {
  const client = new SubscriptionsTransportClient(
    wsEndpoint,
    {
      lazy: true,
      ...options,
    },
    ws
  );

  const subscribe: SubscribeFunction = function subscribe(query, { onData, variables, operationName, extensions } = {}) {
    let unsubscribe = () => {};

    let deferValuePromise: DeferredPromise<ExecutionResult<any> | null> | null = createDeferredPromise();

    async function* iteratorGenerator() {
      while (deferValuePromise?.promise) {
        const value = await deferValuePromise.promise;

        if (value != null) {
          yield value;
        }
      }
    }

    const iterator = iteratorGenerator();

    const done = new Promise<void>((resolve, reject) => {
      const { subscribe } = client.request({
        query: isDocumentNode(query) ? print(query) : query,
        variables,
        operationName,
        extensions,
      });

      client.onError(err => {
        reject(err);
      });

      const result = subscribe({
        next(value: ExecutionResult<any>) {
          onData?.(value);
          deferValuePromise?.resolve(value);
          deferValuePromise = createDeferredPromise();
        },
        error(err) {
          reject(err);
          deferValuePromise?.reject(err);
          deferValuePromise = null;
        },
        complete() {
          resolve();
          deferValuePromise?.resolve(null);
          deferValuePromise = null;
        },
      });
      unsubscribe = result.unsubscribe;
    });

    return {
      done,
      unsubscribe,
      iterator,
    };
  };

  return { client, subscribe };
}
