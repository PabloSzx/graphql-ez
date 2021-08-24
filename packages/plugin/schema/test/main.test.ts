import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql';
import { CommonSchema, gql, makeExecutableSchema, startFastifyServer } from 'graphql-ez-testing';

import { ezGraphQLModules } from '../../modules/src/index';
import { ezScalars } from '../../scalars/src/index';
import { ezSchema } from '../src';

test('registerTypeDefs works as expected', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezSchema()],
      },
    },
    buildOptions: {
      prepare({ registerTypeDefs, gql }) {
        registerTypeDefs(gql`
          type Query {
            hello: String!
          }
        `);
      },
    },
  });

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
    "type Query {
      hello: String!
    }
    "
  `);
});

test('registerResolvers works as expected', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezSchema()],
      },
    },
    buildOptions: {
      prepare({ registerTypeDefs, gql, registerResolvers }) {
        registerTypeDefs(gql`
          type Query {
            hello: String!
          }
        `);

        registerResolvers({
          Query: {
            hello() {
              return 'OK';
            },
          },
        });
      },
    },
  });

  expect(await query('{hello}')).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "hello": "OK",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "23",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);
});

test('uses root executable schema config', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezSchema({
            executableSchemaConfig: {
              typeDefs: gql`
                type Query {
                  bye: String!
                }
              `,
              resolvers: {
                Query: {
                  bye() {
                    return 'Bye!';
                  },
                },
              },
            },
          }),
        ],
      },
    },
    buildOptions: {
      prepare({ registerTypeDefs, gql, registerResolvers }) {
        registerTypeDefs(gql`
          type Query {
            hello: String!
          }
        `);

        registerResolvers({
          Query: {
            hello() {
              return 'OK';
            },
          },
        });
      },
    },
  });

  expect(await query('{hello bye}')).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "bye": "Bye!",
    "hello": "OK",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "36",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);
});

test('hooks with scalars plugin as expected', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezSchema(),
          ezScalars({
            NonEmptyString: 1,
          }),
        ],
      },
    },
    buildOptions: {
      prepare({ registerTypeDefs, gql, registerResolvers }) {
        registerTypeDefs(gql`
          type Query {
            hello: NonEmptyString!
          }
        `);

        registerResolvers({
          Query: {
            hello() {
              return 'OK';
            },
          },
        });
      },
    },
  });

  expect(await query('{hello}')).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "hello": "OK",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "23",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);
});

test('merges schemas', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezSchema({
            schema: makeExecutableSchema({
              typeDefs: gql`
                type Query {
                  bye: String!
                }
              `,
              resolvers: {
                Query: {
                  bye() {
                    return 'Bye!';
                  },
                },
              },
            }),
          }),
        ],
      },
    },
    buildOptions: {
      prepare({ registerTypeDefs, gql, registerResolvers }) {
        registerTypeDefs(gql`
          type Query {
            hello: String!
          }
        `);

        registerResolvers({
          Query: {
            hello() {
              return 'OK';
            },
          },
        });
      },
    },
  });

  expect(await query('{hello bye}')).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "bye": "Bye!",
    "hello": "OK",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "36",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);
});

test('cannot use registeredResolvers by itself', async () => {
  await expect(
    startFastifyServer({
      createOptions: {
        ez: {
          plugins: [ezSchema()],
        },
      },

      buildOptions: {
        prepare({ registerResolvers }) {
          registerResolvers({
            Query: {
              hello() {},
            },
          });
        },
      },
    })
  ).rejects.toMatchInlineSnapshot(
    `[Error: [graphql-ez] To use 'registerResolvers' you need to specify at least one type definition or external schema]`
  );
});

test('registerResolvers works to extend schemas', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezSchema({
            schema: makeExecutableSchema({
              typeDefs: gql`
                type Query {
                  hello: String!
                }
              `,
            }),
          }),
        ],
      },
    },
    buildOptions: {
      prepare({ registerResolvers }) {
        registerResolvers({
          Query: {
            hello() {
              return 'Hello World!';
            },
          },
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
});

test('works with modules plugin', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezGraphQLModules(),
          ezSchema({
            schema: {
              typeDefs: gql`
                type Query {
                  bye: String!
                }
              `,
              resolvers: {
                Query: {
                  bye() {
                    return 'Bye!';
                  },
                },
              },
            },
          }),
        ],
      },
    },
    buildOptions: {
      prepare({ registerModule }) {
        registerModule(CommonSchema.module);
      },
    },
  });

  expect(await query('{hello bye}')).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "bye": "Bye!",
    "hello": "Hello World!",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "46",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);
});
