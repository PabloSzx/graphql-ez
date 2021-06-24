import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql';

import { ezUpload } from '@graphql-ez/plugin-upload';
import { CommonSchema, startFastifyServer } from '@graphql-ez/testing-new';

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
