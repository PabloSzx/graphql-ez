import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, lexicographicSortSchema, printSchema } from 'graphql';
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
    }"
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
    {
      "data": {
        "hello": "OK",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "23",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
        },
        "statusCode": 200,
      },
    }
  `);
});

test('registerSchema works as expected', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezSchema({
            transformFinalSchema: lexicographicSortSchema,
          }),
        ],
      },
    },
    buildOptions: {
      prepare({ gql, registerSchema }) {
        registerSchema({
          typeDefs: gql`
            type Query {
              hello: String!
            }
          `,
          resolvers: {
            Query: {
              hello() {
                return 'OK';
              },
            },
          },
        });
      },
    },
  });

  expect(await query('{hello}')).toMatchInlineSnapshot(`
    {
      "data": {
        "hello": "OK",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "23",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
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
    {
      "data": {
        "bye": "Bye!",
        "hello": "OK",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "36",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
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
    {
      "data": {
        "hello": "OK",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "23",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
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
    {
      "data": {
        "bye": "Bye!",
        "hello": "OK",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "36",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
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
    {
      "data": {
        "hello": "Hello World!",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "33",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
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
    {
      "data": {
        "bye": "Bye!",
        "hello": "Hello World!",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "46",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
        },
        "statusCode": 200,
      },
    }
  `);
});

test('adds the specified graphql schema config', async () => {
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
            graphqlSchemaConfig: {
              enableDeferStream: true,
            },
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

  const schemaString = printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!));

  expect(schemaString).toContain('@defer');

  expect(schemaString).toMatchInlineSnapshot(`
    "\\"\\"\\"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @defer(
      \\"\\"\\"Deferred when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    \\"\\"\\"
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @stream(
      \\"\\"\\"Stream when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String

      \\"\\"\\"Number of items to return immediately\\"\\"\\"
      initialCount: Int = 0
    ) on FIELD

    type Query {
      hello: String!
    }"
  `);
});
