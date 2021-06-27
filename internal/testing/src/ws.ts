import { print } from 'graphql';
import { ClientOptions as GraphQLWSClientOptions, createClient as createGraphQLWSClient } from 'graphql-ws';
import {
  ClientOptions as SubscriptionsTransportClientOptions,
  SubscriptionClient as SubscriptionsTransportClient,
} from 'subscriptions-transport-ws-envelop/client';
import ws from 'ws';

import { LazyPromise } from 'graphql-ez/utils/promise';
import { isDocumentNode } from '@graphql-tools/utils';

import { TearDownPromises } from './common';

export type { SubscriptionsTransportClientOptions, GraphQLWSClientOptions };
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export function createGraphQLWSWebsocketsClient(
  httpUrl: string,
  path = '/graphql',
  options: Partial<GraphQLWSClientOptions> = {}
) {
  const url = new URL(httpUrl + path);

  url.protocol = url.protocol.replace('http', 'ws');

  const client = createGraphQLWSClient({
    url: url.href,
    webSocketImpl: ws,
    lazy: true,
    retryAttempts: 0,
    ...options,
  });

  TearDownPromises.push(
    LazyPromise(async () => {
      try {
        await client.dispose();
      } catch (err) {}
    })
  );

  function subscribe<TResult = unknown>(query: string | TypedDocumentNode<TResult>, onData: (data: TResult) => void) {
    let unsubscribe = () => {};

    const done = new Promise<void>((resolve, reject) => {
      unsubscribe = client.subscribe(
        {
          query: isDocumentNode(query) ? print(query) : query,
        },
        {
          next: onData,
          error: reject,
          complete: resolve,
        }
      );
    });

    return {
      done,
      unsubscribe,
    };
  }

  return { subscribe };
}

export function createSubscriptionsTransportWebsocketsClient(
  httpUrl: string,
  path = '/graphql',
  options: Partial<SubscriptionsTransportClientOptions> = {}
) {
  const url = new URL(httpUrl + path);

  url.protocol = url.protocol.replace('http', 'ws');

  const client = new SubscriptionsTransportClient(
    url.href,
    {
      lazy: true,
      reconnectionAttempts: 0,
      ...options,
    },
    ws
  );

  TearDownPromises.push(
    LazyPromise(async () => {
      client.close();
    })
  );

  function subscribe<TResult = unknown>(query: string | TypedDocumentNode<TResult>, onData: (data: TResult) => void) {
    let unsubscribe = () => {};

    const done = new Promise<void>((resolve, reject) => {
      const { subscribe } = client.request({
        query: isDocumentNode(query) ? print(query) : query,
      });

      client.onError(err => {
        reject(err);
      });

      const result = subscribe({
        // @ts-expect-error
        next: onData,
        error: reject,
        complete: resolve,
      });
      unsubscribe = result.unsubscribe;
    });

    return {
      done,
      unsubscribe,
    };
  }

  return { subscribe };
}

export const PingSubscriptionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'pingSubscription' },
      selectionSet: { kind: 'SelectionSet', selections: [{ kind: 'Field', name: { kind: 'Name', value: 'ping' } }] },
    },
  ],
} as unknown as TypedDocumentNode<
  {
    ping: string;
  },
  {}
>;
