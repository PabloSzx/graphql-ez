import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql';

import { ezUpload } from '@graphql-ez/plugin-upload';
import { CommonSchema, startFastifyServer } from 'graphql-ez-testing';

import { ezGraphQLModules } from '../src';

test('register module with extra modules', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezGraphQLModules(), ezUpload()],
      },
    },
    buildOptions: {
      prepare(appBuilder) {
        appBuilder.registerModule(CommonSchema.typeDefs, {
          resolvers: CommonSchema.resolvers,
        });
      },
    },
  });

  expect(await query('{hello}')).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "hello": "Hello World!",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "33",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
"\\"\\"\\"The \`Upload\` scalar type represents a file upload.\\"\\"\\"
scalar Upload

type Query {
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

test('adding module', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezGraphQLModules()],
      },
    },
    buildOptions: {
      prepare(appBuilder) {
        appBuilder.registerModule(CommonSchema.module);
      },
    },
  });

  expect(await query('{hello}')).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "hello": "Hello World!",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "33",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
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
