import EventSource from 'eventsource';
import got from 'got';
import { printSchema } from 'graphql';

import { CommonSchema, PingSubscription, startKoaServer } from '@graphql-ez/testing';

test.concurrent('basic', async () => {
  const { query, addressWithoutProtocol, ezApp } = await startKoaServer({
    createOptions: {
      schema: CommonSchema.schema,
      async buildContext(args) {
        return {
          foo: 'bar',
          ip: args.koa?.request.ip,
        };
      },
      cors: true,
    },
  });

  expect(
    JSON.parse(
      (
        (
          await query<{
            context: string;
          }>(`{context}`)
        ).data?.context || '{}'
      ).replace(new RegExp(addressWithoutProtocol, 'g'), '__host__')
    )
  ).toMatchInlineSnapshot(`
    Object {
      "document": Object {
        "definitions": Array [
          Object {
            "directives": Array [],
            "kind": "OperationDefinition",
            "loc": Object {
              "end": 9,
              "start": 0,
            },
            "operation": "query",
            "selectionSet": Object {
              "kind": "SelectionSet",
              "loc": Object {
                "end": 9,
                "start": 0,
              },
              "selections": Array [
                Object {
                  "arguments": Array [],
                  "directives": Array [],
                  "kind": "Field",
                  "loc": Object {
                    "end": 8,
                    "start": 1,
                  },
                  "name": Object {
                    "kind": "Name",
                    "loc": Object {
                      "end": 8,
                      "start": 1,
                    },
                    "value": "context",
                  },
                },
              ],
            },
            "variableDefinitions": Array [],
          },
        ],
        "kind": "Document",
        "loc": Object {
          "end": 9,
          "start": 0,
        },
      },
      "foo": "bar",
      "ip": "::ffff:127.0.0.1",
      "operation": Object {
        "directives": Array [],
        "kind": "OperationDefinition",
        "loc": Object {
          "end": 9,
          "start": 0,
        },
        "operation": "query",
        "selectionSet": Object {
          "kind": "SelectionSet",
          "loc": Object {
            "end": 9,
            "start": 0,
          },
          "selections": Array [
            Object {
              "arguments": Array [],
              "directives": Array [],
              "kind": "Field",
              "loc": Object {
                "end": 8,
                "start": 1,
              },
              "name": Object {
                "kind": "Name",
                "loc": Object {
                  "end": 8,
                  "start": 1,
                },
                "value": "context",
              },
            },
          ],
        },
        "variableDefinitions": Array [],
      },
      "request": Object {
        "body": Object {
          "query": "{context}",
        },
        "headers": Object {
          "connection": "keep-alive",
          "content-length": "21",
          "content-type": "application/json",
          "host": "__host__",
        },
        "method": "POST",
        "query": Object {},
      },
    }
  `);

  expect(printSchema((await ezApp.getEnveloped)().schema)).toMatchInlineSnapshot(`
    "type Query {
      hello: String!
      users: [User!]!
      stream: [String!]!
      context: String!
    }

    type User {
      id: Int!
    }
    "
  `);
});

test.concurrent('query with @stream', async () => {
  const { address } = await startKoaServer({
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
  const { address } = await startKoaServer({
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
