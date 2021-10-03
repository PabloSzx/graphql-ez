import { printSchema } from 'graphql';
import {
  CommonSchema,
  expectCommonQueryStream,
  expectCommonServerSideEventSubscription,
  PingSubscription,
  startFastifyServer,
} from 'graphql-ez-testing';

test('basic', async () => {
  const { query, addressWithoutProtocol, ezApp } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      cors: true,
      async buildContext(args) {
        return {
          foo: 'bar',
          ip: args.fastify?.request.ip,
        };
      },
    },
  });

  expect(
    JSON.parse(
      (
        await query<{
          context: string;
        }>(`{context}`)
      ).data!.context.replace(new RegExp(addressWithoutProtocol, 'g'), '__host__')
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
      "ip": "127.0.0.1",
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

test('query with @stream', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  await expectCommonQueryStream(address);
});

test('SSE subscription', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  await expectCommonServerSideEventSubscription(address);
});

test('batched queries', async () => {
  const { batchedQueries } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      allowBatchedQueries: true,
    },
  });

  await expect(
    batchedQueries([
      { query: '{hello}' },
      {
        query: '{hello2:hello}',
      },
    ])
  ).resolves.toMatchInlineSnapshot(`
          Object {
            "http": Object {
              "headers": Object {
                "connection": "keep-alive",
                "content-length": "70",
                "content-type": "application/json; charset=utf-8",
                "keep-alive": "timeout=5",
              },
              "statusCode": 200,
            },
            "result": Array [
              Object {
                "data": Object {
                  "hello": "Hello World!",
                },
              },
              Object {
                "data": Object {
                  "hello2": "Hello World!",
                },
              },
            ],
          }
        `);
});
