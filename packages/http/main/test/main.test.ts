import { printSchema } from 'graphql';

import {
  CommonSchema,
  PingSubscription,
  startHTTPServer,
  expectCommonQueryStream,
  expectCommonServerSideEventSubscription,
} from 'graphql-ez-testing';

test.concurrent('basic', async () => {
  const { query, addressWithoutProtocol, ezApp } = await startHTTPServer({
    createOptions: {
      schema: CommonSchema.schema,

      async buildContext(args) {
        return {
          foo: 'bar',
          ip: args.http?.request.socket.remoteAddress,
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
}"
`);
});

test.concurrent('query with @stream', async () => {
  const { address } = await startHTTPServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  await expectCommonQueryStream(address);
});

test.concurrent('SSE subscription', async () => {
  const { address } = await startHTTPServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  await expectCommonServerSideEventSubscription(address);
});
