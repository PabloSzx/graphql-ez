import { GraphQLServer } from '../src/index';

import { CreateTestClient, GlobalTeardown } from '@graphql-ez/fastify-testing';

afterEach(GlobalTeardown);

test('works', async () => {
  const { ezApp, gql, builtApp } = GraphQLServer({});

  ezApp.registerTypeDefs(gql`
    type Query {
      hello: String!
      users: [User!]!
    }
    type User {
      id: ID!
      name: String!
    }
  `);

  ezApp.registerResolvers({
    Query: {
      hello() {
        return 'Hello World';
      },
      users() {
        return [
          {
            id: 1,
            name: 'one',
          },
          {
            id: 1,
            name: 'one',
          },
          {
            id: 2,
            name: 'two',
          },
        ];
      },
    },
  });

  const { query, schemaString } = await CreateTestClient(builtApp);

  expect(schemaString).toMatchInlineSnapshot(`
"type Query {
  hello: String!
  users: [User!]!
}

type User {
  id: ID!
  name: String!
}
"
`);

  await expect(query('{hello}')).resolves.toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "hello": "Hello World",
            },
          }
        `);

  await expect(query('{users{__typename id name}}', {})).resolves.toMatchInlineSnapshot(`
Object {
  "data": Object {
    "users": Array [
      Object {
        "__typename": "User",
        "id": "1",
        "name": "one",
      },
      Object {
        "__typename": "User",
        "id": "1",
        "name": "one",
      },
      Object {
        "__typename": "User",
        "id": "2",
        "name": "two",
      },
    ],
  },
}
`);
});
