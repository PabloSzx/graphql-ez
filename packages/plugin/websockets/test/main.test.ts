import {
  startFastifyServer,
  startExpressServer,
  startHTTPServer,
  startHapiServer,
  startKoaServer,
  createGraphQLWSWebsocketsClient,
  createSubscriptionsTransportWebsocketsClient,
  PingSubscriptionDocument,
  CommonSchema,
  PingSubscription,
} from 'graphql-ez-testing';
import { ezWebSockets } from '../src/index';

async function checkSubscription(
  client: ReturnType<typeof createGraphQLWSWebsocketsClient> | ReturnType<typeof createSubscriptionsTransportWebsocketsClient>
) {
  let n = 0;

  const { done } = client.subscribe(PingSubscriptionDocument, data => {
    ++n;

    switch (n) {
      case 1:
        return expect(data).toStrictEqual({
          data: {
            ping: 'pong1',
          },
        });
      case 2:
        return expect(data).toStrictEqual({
          data: {
            ping: 'pong2',
          },
        });
      case 3:
        return expect(data).toStrictEqual({
          data: {
            ping: 'pong3',
          },
        });
      default:
        throw Error('Unexpected data from subscription!');
    }
  });

  await done;

  expect(n).toBe(3);

  if ('dispose' in client.client) {
    await client.client.dispose();
  } else {
    client.client.close();
  }
}

describe('fastify', () => {
  test('adaptive', async () => {
    const { GraphQLWSWebsocketsClient, SubscriptionsTransportWebsocketsClient } = await startFastifyServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('adaptive')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    });

    await Promise.all([checkSubscription(GraphQLWSWebsocketsClient), checkSubscription(SubscriptionsTransportWebsocketsClient)]);
  });

  test('no implementation enabled warning', async () => {
    let warnMessage: unknown;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(message => {
      warnMessage = message;
    });

    try {
      await startFastifyServer({
        createOptions: {
          ez: {
            plugins: [ezWebSockets({})],
          },
          schema: [CommonSchema.schema, PingSubscription.schema],
        },
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);

      expect(warnMessage).toMatchInlineSnapshot(`"No Websockets implementations enabled!"`);
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('only new', async () => {
    const { GraphQLWSWebsocketsClient, SubscriptionsTransportWebsocketsClient } = await startFastifyServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('new')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    });

    await Promise.all([
      checkSubscription(GraphQLWSWebsocketsClient),
      checkSubscription(SubscriptionsTransportWebsocketsClient)
        .then(() => {
          throw Error("DIDN'T THROW");
        })
        .catch(err => {
          expect(err.message).toMatchInlineSnapshot(`"Server sent no subprotocol"`);
        }),
    ]);
  });

  test('only legacy', async () => {
    const { GraphQLWSWebsocketsClient, SubscriptionsTransportWebsocketsClient } = await startFastifyServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('legacy')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    });

    await Promise.all([
      checkSubscription(GraphQLWSWebsocketsClient)
        .then(() => {
          throw Error("DIDN'T THROW");
        })
        .catch(err => {
          expect(err?.code).toBe(1002);
        }),
      checkSubscription(SubscriptionsTransportWebsocketsClient),
    ]);
  });

  test('wrong path', async () => {
    const { GraphQLWSWebsocketsClient } = await startFastifyServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('legacy')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
      clientWebsocketPath: '/wrong_path',
    });

    await checkSubscription(GraphQLWSWebsocketsClient)
      .then(() => {
        throw Error("Didn't throw!");
      })
      .catch(err => {
        expect(err?.code).toBe(1001);
      });
  });
});

describe('express', () => {
  test('adaptive', async () => {
    const { GraphQLWSWebsocketsClient, SubscriptionsTransportWebsocketsClient } = await startExpressServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('adaptive')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    });

    await Promise.all([checkSubscription(GraphQLWSWebsocketsClient), checkSubscription(SubscriptionsTransportWebsocketsClient)]);
  });
});

describe('http', () => {
  test('adaptive', async () => {
    const { GraphQLWSWebsocketsClient, SubscriptionsTransportWebsocketsClient } = await startHTTPServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('adaptive')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    });

    await Promise.all([checkSubscription(GraphQLWSWebsocketsClient), checkSubscription(SubscriptionsTransportWebsocketsClient)]);
  });
});

describe('hapi', () => {
  test('adaptive', async () => {
    const { GraphQLWSWebsocketsClient, SubscriptionsTransportWebsocketsClient } = await startHapiServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('adaptive')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    });

    await Promise.all([checkSubscription(GraphQLWSWebsocketsClient), checkSubscription(SubscriptionsTransportWebsocketsClient)]);
  });
});

describe('koa', () => {
  test('adaptive', async () => {
    const { GraphQLWSWebsocketsClient, SubscriptionsTransportWebsocketsClient } = await startKoaServer({
      createOptions: {
        ez: {
          plugins: [ezWebSockets('adaptive')],
        },
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    });

    await Promise.all([checkSubscription(GraphQLWSWebsocketsClient), checkSubscription(SubscriptionsTransportWebsocketsClient)]);
  });
});
