import EventSource from 'eventsource';
import got from 'got';

import { CommonSchema, PingSubscription, startFastifyServer } from '@graphql-ez/testing-new';

test.concurrent('basic', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  expect(await query(`{hello}`)).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "hello": "Hello World!",
      },
    }
  `);
});

test.concurrent('batched queries', async () => {
  const { request } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      cache: true,
      allowBatchedQueries: true,
    },
  });

  expect(
    JSON.parse(
      await request({
        method: 'POST',
        path: '/graphql',
        body: JSON.stringify([
          {
            query: `{hello}`,
          },

          {
            query: `{hello}`,
          },
        ]),

        headers: {
          'content-type': 'application/json',
        },
      })
    )
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "data": Object {
          "hello": "Hello World!",
        },
      },
      Object {
        "data": Object {
          "hello": "Hello World!",
        },
      },
    ]
  `);
});

test.concurrent('query with @stream', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  const stream = got.stream.post(`${address}/graphql`, {
    json: {
      query: `
        query {
          stream @stream(initialCount: 1)
        }
        `,
    },
  });

  try {
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk.toString());
    }
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toContain(`{"data":{"stream":["A"]},"hasNext":true}`);
    expect(chunks[1]).toContain(`{"data":"B","path":["stream",1],"hasNext":true}`);
    expect(chunks[2]).toContain(`{"data":"C","path":["stream",2],"hasNext":true}`);
  } catch (err) {
    stream.destroy();
    throw err;
  }
});

test.concurrent('SSE subscription', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  const eventSource = new EventSource(`${address}/graphql?query=subscription{ping}`);

  let n = 0;
  const payload = await new Promise<string>(resolve => {
    eventSource.addEventListener('message', (event: any) => {
      switch (++n) {
        case 1:
          return expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong1',
            },
          });
        case 2:
          return expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong2',
            },
          });
        case 3:
          expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong3',
            },
          });
          return resolve('OK');
        default:
          console.error(event);
          throw Error('Unexpected event');
      }
    });
  }).catch(err => {
    eventSource.close();
    throw err;
  });
  eventSource.close();
  expect(payload).toBe('OK');
});
