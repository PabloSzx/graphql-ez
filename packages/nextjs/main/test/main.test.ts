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
{
  "data": {
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
         "accept": "*/*",
         "accept-encoding": "gzip,deflate",
         "connection": "keep-alive",
         "content-length": "21",
         "content-type": "application/json",
         "host": "__host__",
         "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
         "x-msw-intention": "bypass",
       },
       "method": "POST",
       "query": {},
     },
   }
  `);
});
