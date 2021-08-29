import { CreateTestClient, GlobalTeardown } from '@graphql-ez/nextjs-testing';

import { CommonSchema } from 'graphql-ez-testing';

import { testApiHandler } from 'next-test-api-route-handler';

import { ezSchema } from '@graphql-ez/plugin-schema';

import { EZContext, gql, BuildContextArgs, CreateApp } from '../src';

afterAll(GlobalTeardown);

test('basic direct api handler', async () => {
  const { buildApp } = CreateApp({
    schema: CommonSchema.schema,
  });
  await testApiHandler({
    handler: buildApp().apiHandler,
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{hello}' }),
      });

      await expect(res.json()).resolves.toMatchInlineSnapshot(`
Object {
  "data": Object {
    "hello": "Hello World!",
  },
}
`);
    },
  });
});

test('with testing client', async () => {
  function buildContext(_args: BuildContextArgs) {
    return {
      foo: 'bar',
    };
  }

  const { query } = await CreateTestClient({
    buildContext,
    ez: {
      plugins: [
        ezSchema({
          schema: {
            typeDefs: gql`
              type Query {
                hello: String!
                context: String!
              }
            `,
            resolvers: {
              Query: {
                hello() {
                  return 'Hello World!';
                },
                context(_root: unknown, _args: unknown, { req, next, ...ctx }: EZContext) {
                  return JSON.stringify(ctx);
                },
              },
            },
          },
        }),
      ],
    },
  });

  const contextString = (
    await query<{
      context: string;
    }>(`{context}`)
  ).data!.context;

  expect(JSON.parse(contextString.replace(/localhost:(.+?)"/g, '__host__"'))).toMatchInlineSnapshot(`
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
      "accept": "*/*",
      "accept-encoding": "gzip,deflate",
      "connection": "close",
      "content-length": "21",
      "content-type": "application/json",
      "host": "__host__",
      "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
    },
    "method": "POST",
    "query": Object {},
  },
}
`);
});
