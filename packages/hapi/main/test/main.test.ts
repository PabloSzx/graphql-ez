import { printSchema } from 'graphql';

import {
  CommonSchema,
  PingSubscription,
  startHapiServer,
  expectCommonQueryStream,
  expectCommonServerSideEventSubscription,
  testIfStreamDefer,
} from 'graphql-ez-testing';

test('basic', async () => {
  const { query, addressWithoutProtocol, ezApp } = await startHapiServer({
    createOptions: {
      schema: CommonSchema.schema,
      cors: true,
      async buildContext(args) {
        return {
          foo: 'bar',
          ip: args.hapi?.request.info.remoteAddress,
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
    {
      "document": {
        "definitions": [
          {
            "directives": [],
            "kind": "OperationDefinition",
            "loc": {
              "end": 9,
              "start": 0,
            },
            "operation": "query",
            "selectionSet": {
              "kind": "SelectionSet",
              "loc": {
                "end": 9,
                "start": 0,
              },
              "selections": [
                {
                  "arguments": [],
                  "directives": [],
                  "kind": "Field",
                  "loc": {
                    "end": 8,
                    "start": 1,
                  },
                  "name": {
                    "kind": "Name",
                    "loc": {
                      "end": 8,
                      "start": 1,
                    },
                    "value": "context",
                  },
                },
              ],
            },
            "variableDefinitions": [],
          },
        ],
        "kind": "Document",
        "loc": {
          "end": 9,
          "start": 0,
        },
      },
      "foo": "bar",
      "ip": "127.0.0.1",
      "operation": {
        "directives": [],
        "kind": "OperationDefinition",
        "loc": {
          "end": 9,
          "start": 0,
        },
        "operation": "query",
        "selectionSet": {
          "kind": "SelectionSet",
          "loc": {
            "end": 9,
            "start": 0,
          },
          "selections": [
            {
              "arguments": [],
              "directives": [],
              "kind": "Field",
              "loc": {
                "end": 8,
                "start": 1,
              },
              "name": {
                "kind": "Name",
                "loc": {
                  "end": 8,
                  "start": 1,
                },
                "value": "context",
              },
            },
          ],
        },
        "variableDefinitions": [],
      },
      "request": {
        "body": {
          "query": "{context}",
        },
        "headers": {
          "connection": "keep-alive",
          "content-length": "21",
          "content-type": "application/json",
          "host": "__host__",
        },
        "method": "post",
        "query": {},
      },
    }
  `);

  expect(printSchema(ezApp.getEnveloped().schema)).toMatchInlineSnapshot(`
    """"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    """
    directive @defer(
      """Deferred when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    """
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    """
    directive @stream(
      """Stream when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String

      """Number of items to return immediately"""
      initialCount: Int = 0
    ) on FIELD

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }"
  `);
});

testIfStreamDefer('query with @stream', async () => {
  const { address } = await startHapiServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  await expectCommonQueryStream(address);
});

test('SSE subscription', async () => {
  const { address } = await startHapiServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  await expectCommonServerSideEventSubscription(address);
});
