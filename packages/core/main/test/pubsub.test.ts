import { ezWebSockets } from '@graphql-ez/plugin-websockets';
import { createDeferredPromise, gql, startFastifyServer, waitForExpect } from 'graphql-ez-testing';
import { InMemoryPubSub, StrictInMemoryPubSub } from '../src/pubsub';

describe('InMemoryPubSub', () => {
  test('works by itself', async () => {
    expect.assertions(4);
    const pubSub = new InMemoryPubSub();

    const iterator = pubSub.subscribe<number>('hello');

    setTimeout(() => {
      pubSub.publish('hello', 1);

      pubSub.publish('hello', 2);

      pubSub.publish('hello', 3);

      pubSub.publish('hello', 4);

      pubSub.unsubscribe(iterator);
    });

    let i = 0;
    for await (const data of iterator) {
      expect(data).toBe(++i);
    }
  });

  test('with filter', async () => {
    expect.assertions(2);
    const pubSub = new InMemoryPubSub();

    const iterator = pubSub.subscribe<number>('hello');

    setTimeout(() => {
      pubSub.publish('hello', 1);

      pubSub.publish('hello', 2);

      pubSub.publish('hello', 3);

      pubSub.publish('hello', 4);

      pubSub.unsubscribe(iterator);
    });

    let i = 2;
    for await (const data of pubSub.withFilter(iterator, data => data > 2)) {
      expect(data).toBe(++i);
    }
  });

  test('in api', async () => {
    const pubsub = new InMemoryPubSub();
    let isReady = false;
    const testClient = await startFastifyServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('new')],
        },
        schema: {
          typeDefs: gql`
            type Query {
              ready: Boolean!
            }
            type Mutation {
              sendNotification(message: String!): Boolean!
              close: Boolean!
            }
            type Subscription {
              notification: String!
            }
          `,
          resolvers: {
            Query: {
              ready() {
                return isReady;
              },
            },
            Mutation: {
              sendNotification(_root, { message }) {
                pubsub.publish('notification', {
                  notification: message,
                });
                return true;
              },
              close() {
                pubsub.close();
                return true;
              },
            },
            Subscription: {
              notification: {
                subscribe() {
                  isReady = true;
                  return pubsub.subscribe('notification');
                },
              },
            },
          },
        },
      },
    });

    const ok = createDeferredPromise();
    const result = testClient.GraphQLWSWebsocketsClient.subscribe<{
      data: {
        notification: string;
      };
    }>('subscription{notification}', data => {
      try {
        expect(data).toStrictEqual({
          data: {
            notification: 'hello world',
          },
        });
        ok.resolve();
      } catch (err) {
        ok.reject(err);
      }
    });

    await waitForExpect(async () => {
      expect((await testClient.query<{ ready: boolean }>('{ready}')).data?.ready).toBe(true);
    });

    await testClient.query('mutation{sendNotification(message: "hello world")}');

    await ok.promise;

    await testClient.query('mutation{close}');

    await result.done;
  });
});

describe('StrictInMemoryPubSub', () => {
  test('works by itself', async () => {
    expect.assertions(4);
    const pubSub = new StrictInMemoryPubSub<{
      hello: number;
    }>();

    pubSub.withFilter(pubSub.subscribe('hello'), data => !!data);

    const iterator = pubSub.subscribe('hello');

    setTimeout(() => {
      pubSub.publish('hello', 1);

      pubSub.publish('hello', 2);

      pubSub.publish('hello', 3);

      pubSub.publish('hello', 4);

      pubSub.unsubscribe(iterator);
    });

    let i = 0;
    for await (const data of iterator) {
      expect(data).toBe(++i);
    }
  });

  test('in api', async () => {
    const pubsub = new StrictInMemoryPubSub<{
      notification: { notification: string };
    }>();
    let isReady = false;

    const testClient = await startFastifyServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('new')],
        },
        schema: {
          typeDefs: gql`
            type Query {
              ready: Boolean!
            }
            type Mutation {
              sendNotification(message: String!): Boolean!
              close: Boolean!
            }
            type Subscription {
              notification: String!
            }
          `,
          resolvers: {
            Query: {
              ready() {
                return isReady;
              },
            },
            Mutation: {
              sendNotification(_root, { message }) {
                pubsub.publish('notification', {
                  notification: message,
                });
                return true;
              },
              close() {
                pubsub.close();
                return true;
              },
            },
            Subscription: {
              notification: {
                subscribe() {
                  isReady = true;
                  return pubsub.subscribe('notification');
                },
              },
            },
          },
        },
      },
    });

    const ok = createDeferredPromise();
    const result = testClient.GraphQLWSWebsocketsClient.subscribe<{
      data: {
        notification: string;
      };
    }>('subscription{notification}', data => {
      try {
        expect(data).toStrictEqual({
          data: {
            notification: 'hello world',
          },
        });
        ok.resolve();
      } catch (err) {
        ok.reject(err);
      }
    });

    await waitForExpect(async () => {
      expect((await testClient.query<{ ready: boolean }>('{ready}')).data?.ready).toBe(true);
    });

    await testClient.query('mutation{sendNotification(message: "hello world")}');

    await ok.promise;

    await testClient.query('mutation{close}');

    await result.done;
  });
});
