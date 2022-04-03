import { createDeferredPromise, DeferredPromise, LazyPromise } from '@graphql-ez/utils/promise';
import type { ExecutionResult } from 'graphql';
import type { SubscriptionsTransportClientOptions, SubscriptionsTransportClient } from '../deps.js';
import type { SubscribeFunction } from '../types';
import { getQueryString, lazyDeps } from '../utils';

export type { SubscriptionsTransportClientOptions, SubscriptionsTransportClient };

export function createSubscriptionsTransportWebsocketsClient(
  wsEndpoint: string,
  options: SubscriptionsTransportClientOptions = {}
) {
  const client = LazyPromise(async () => {
    const { SubscriptionsTransportClient, ws } = await lazyDeps;

    return new SubscriptionsTransportClient(
      wsEndpoint,
      {
        lazy: true,
        ...options,
      },
      ws
    );
  });

  const subscribe: SubscribeFunction = function subscribe(query, { onData, variables, operationName, extensions } = {}) {
    let unsubscribeFn: () => void;

    const unsubscribe = async () => {
      if (!unsubscribeFn) await done;

      unsubscribeFn?.();
    };

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

    const done = new Promise<void>(async (resolve, reject) => {
      try {
        const { subscribe } = (await client).request({
          query: getQueryString(query),
          variables,
          operationName,
          extensions,
        });

        (await client).onError(err => {
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
        unsubscribeFn = result.unsubscribe;
      } catch (err) {
        reject(err);
      }
    });

    return {
      done,
      unsubscribe,
      iterator,
    };
  };

  return { client, subscribe };
}
