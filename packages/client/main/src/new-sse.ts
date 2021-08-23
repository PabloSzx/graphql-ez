import { LazyPromise, createDeferredPromise, DeferredPromise } from '@graphql-ez/utils/promise';
import { isDocumentNode } from '@graphql-tools/utils';
import { print } from 'graphql';
import type { ExecutionResult } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { SubscribeOptionsWithoutHeaders } from './types';

export function createNewSSESubscription(
  href: string | undefined,
  getHeaders: (headers?: IncomingHttpHeaders) => Record<string, any>
) {
  const deps = LazyPromise(async () => {
    const [
      { default: NodeFetch },
      {
        default: { AbortController: NodeAbortControler },
      },
      { createClient },
    ] = await Promise.all([import('node-fetch'), import('node-abort-controller'), import('graphql-sse')]);

    return {
      NodeFetch,
      NodeAbortControler,
      createClient,
    };
  });

  const clientPromise = LazyPromise(async () => {
    const { createClient, NodeAbortControler, NodeFetch } = await deps;

    if (!href) throw Error('No SSE Endpoint specified! make sure to add ezSSE correctly as a plugin.');

    return createClient({
      url: href,
      abortControllerImpl: NodeAbortControler,
      fetchFn: NodeFetch,
      headers() {
        return getHeaders();
      },
    });
  });

  const subscribe = async function subscribe<
    TResult = unknown,
    TVariables extends Record<string, unknown> = {
      [key: string]: any;
    },
    TExtensions extends Record<string, unknown> = Record<string, unknown>
  >(
    query: string | TypedDocumentNode<TResult, TVariables>,
    { variables, operationName, extensions, onData }: SubscribeOptionsWithoutHeaders<TResult, TVariables, TExtensions> = {}
  ) {
    const client = await clientPromise;

    let unsubscribe = () => {};

    let deferValuePromise: DeferredPromise<ExecutionResult<TResult> | null> | null = createDeferredPromise();

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
          extensions: extensions || undefined,
        },
        {
          next(value: ExecutionResult<any>) {
            console.log({
              value,
            });
            onData?.(value);
            deferValuePromise?.resolve(value);
            deferValuePromise = createDeferredPromise();
          },
          error(err) {
            console.log('hhhh');
            reject(err);
            deferValuePromise?.reject(err);
            deferValuePromise = null;
          },
          complete() {
            console.log(444);
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

  return {
    subscribe,
    clientPromise,
  };
}
