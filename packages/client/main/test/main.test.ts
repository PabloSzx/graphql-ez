import { CommonSchema, createDeferredPromise, PingSubscription, startFastifyServer } from 'graphql-ez-testing';

import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';

import { EZClient } from '../src';

test('ok', async () => {
  const { address, server } = await startFastifyServer({
    createOptions: {
      prepare(appBuilder) {
        appBuilder.registerModule(CommonSchema.module);
        appBuilder.registerModule(PingSubscription.module);
      },
      ez: {
        plugins: [ezGraphQLModules(), ezWebSockets()],
      },
    },
  });

  const { query, websockets, sseSubscribe, stream } = EZClient({
    endpoint: address + '/graphql',
  });

  await expect(
    query('query{hello}', {
      variables: {
        n: 10,
      },
    })
  ).resolves.toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "hello": "Hello World!",
            },
          }
        `);

  {
    const done = createDeferredPromise<unknown>();

    const { unsubscribe } = await websockets.subscribe<number>('{hello}', {
      onData(value) {
        done.resolve(value);
      },
    });

    await expect(done.promise).resolves.toMatchInlineSnapshot(`
            Object {
              "data": Object {
                "hello": "Hello World!",
              },
            }
          `);

    unsubscribe();
  }

  {
    const done = createDeferredPromise<unknown>();

    const { unsubscribe } = await websockets.legacy.subscribe('{hello2: hello}', {
      onData(value) {
        done.resolve(value);
      },
    });

    await expect(done.promise).resolves.toMatchInlineSnapshot(`
            Object {
              "data": Object {
                "hello2": "Hello World!",
              },
            }
          `);

    unsubscribe();
  }

  {
    const { iterator, unsubscribe } = await websockets.subscribe('subscription{ping}');

    let i = 0;
    for await (const value of iterator) {
      ++i;

      expect(value).toStrictEqual({
        data: {
          ping: `pong${i}`,
        },
      });
    }
    expect(i).toBe(3);

    unsubscribe();
  }

  {
    const { iterator, unsubscribe } = await websockets.legacy.subscribe('subscription{ping}');

    let i = 0;
    for await (const value of iterator) {
      ++i;

      expect(value).toStrictEqual({
        data: {
          ping: `pong${i}`,
        },
      });
    }
    expect(i).toBe(3);

    unsubscribe();
  }

  {
    const { iterator, unsubscribe } = sseSubscribe('subscription{ping}');

    let i = 0;
    for await (const value of iterator) {
      ++i;

      expect(value).toStrictEqual({
        data: {
          ping: `pong${i}`,
        },
      });

      if (i === 3) {
        unsubscribe();
        break;
      }
    }
    expect(i).toBe(3);
  }

  {
    const { iterator } = stream('{stream @stream(initialCount: 1)}');

    let i = 0;
    for await (const value of iterator) {
      switch (++i) {
        case 1:
          expect(value).toContain(`{"data":{"stream":["A"]},"hasNext":true}`);
          break;
        case 2:
          expect(value).toContain(`{"data":"B","path":["stream",1],"hasNext":true}`);
          break;
        case 3:
          expect(value).toContain(`{"data":"C","path":["stream",2],"hasNext":true}`);
          break;
      }
    }
  }

  await (await websockets.client).dispose();

  (await websockets.legacy.client).close();

  await server.close();
});