import { isDocumentNode } from '@graphql-ez/utils/document';
import { createDeferredPromise, DeferredPromise, LazyPromise } from '@graphql-ez/utils/promise';
import { ExecutionResult, print } from 'graphql';
import type { GraphQLWSClient, GraphQLWSClientOptions } from '../deps.js';
import type { SubscribeFunction } from '../types';
import { lazyDeps } from '../utils';

export type { GraphQLWSClientOptions };

export function createGraphQLWSWebsocketsClient(wsEndpoint: string, options: Partial<GraphQLWSClientOptions> = {}) {
  const client: Promise<GraphQLWSClient> = LazyPromise(async () => {
    const { ws, createGraphQLWSClient } = await lazyDeps;

    return createGraphQLWSClient({
      url: wsEndpoint,
      webSocketImpl: ws,
      lazy: true,
      ...options,
    });
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
        unsubscribeFn = (await client).subscribe(
          {
            query: isDocumentNode(query) ? print(query) : query,
            variables,
            operationName,
            extensions,
          },
          {
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
          }
        );
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

  return { subscribe, client };
}
