import { VanillaEZExecutableSchemaDefinition } from '@graphql-ez/plugin-schema';
import { gql } from '@graphql-ez/utils/gql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import safeStringify from 'fast-safe-stringify';
import { GraphQLSchema } from 'graphql';
import type { EZContext } from 'graphql-ez';
import { createModule, TypeDefs } from 'graphql-modules';

export * from '@graphql-ez/plugin-schema';
export { makeExecutableSchema };

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const PingSubscription = {
  typeDefs: gql`
    type Subscription {
      ping: String!
    }
  `,
  resolvers: {
    Subscription: {
      ping: {
        async *subscribe() {
          for (let i = 1; i <= 3; ++i) {
            await sleep(100);

            yield {
              ping: 'pong' + i,
            };
          }
        },
      },
    },
  },
  get schema() {
    return makeExecutableSchema({
      typeDefs: PingSubscription.typeDefs,
      resolvers: PingSubscription.resolvers,
    });
  },
  get module() {
    return createModule({
      id: 'PingSubscription',
      typeDefs: PingSubscription.typeDefs,
      resolvers: PingSubscription.resolvers,
    });
  },
} as const;

export const CommonSchema: VanillaEZExecutableSchemaDefinition & {
  typeDefs: TypeDefs;
  readonly schema: GraphQLSchema;
  readonly module: ReturnType<typeof createModule>;
} = {
  typeDefs: gql`
    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }
    type User {
      id: Int!
    }
  `,
  resolvers: {
    Query: {
      hello(_root: unknown, _args: unknown, _ctx: unknown) {
        return 'Hello World!';
      },
      async users(_root: unknown, _args: unknown, _ctx: unknown) {
        return [...Array(3).keys()].map(id => ({
          id,
        }));
      },
      context(_root: unknown, _args: unknown, { req, fastify, express, hapi, http, koa, ws, next, ...ctx }: EZContext) {
        return safeStringify(ctx);
      },
      stream: {
        resolve: async function* () {
          await sleep(100);
          yield 'A';
          await sleep(100);
          yield 'B';
          await sleep(100);
          yield 'C';
        },
      },
    },
  },
  get schema(): GraphQLSchema {
    return new GraphQLSchema({
      ...makeExecutableSchema({
        typeDefs: CommonSchema.typeDefs,
        resolvers: CommonSchema.resolvers,
      }).toConfig(),
      enableDeferStream: true,
    });
  },
  get module(): ReturnType<typeof createModule> {
    return createModule({
      id: 'CommonSchema',
      typeDefs: CommonSchema.typeDefs,
      resolvers: CommonSchema.resolvers,
    });
  },
};
