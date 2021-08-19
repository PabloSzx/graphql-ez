import { print, ExecutionResult } from 'graphql';
import {
  Client as GraphQLWSClient,
  ClientOptions as GraphQLWSClientOptions,
  createClient as createGraphQLWSClient,
} from 'graphql-ws';
import ws from 'isomorphic-ws';
import { createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';

import { isDocumentNode } from '@graphql-tools/utils';

import type { SubscribeFunction } from '../types';

export type { GraphQLWSClientOptions };

export function createGraphQLWSWebsocketsClient(wsEndpoint: string, options: Partial<GraphQLWSClientOptions> = {}) {
  const client: GraphQLWSClient = createGraphQLWSClient({
    url: wsEndpoint,
    webSocketImpl: ws,
    lazy: true,
    ...options,
  });

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
      unsubscribe = client.subscribe(
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
    });

    return {
      done,
      unsubscribe,
      iterator,
    };
  };

  return { subscribe, client };
}
