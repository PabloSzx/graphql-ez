import safeStringify from 'fast-safe-stringify';
import { gql } from '@graphql-ez/utils/gql';
import { createModule } from 'graphql-modules';

import { makeExecutableSchema } from '@graphql-tools/schema';

import type { EZContext } from 'graphql-ez';
export type {} from 'graphql';

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export * from '@graphql-ez/plugin-schema';

export { makeExecutableSchema };

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

export const CommonSchema = {
  typeDefs: gql`
    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]!
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
  get schema() {
    return makeExecutableSchema({
      typeDefs: CommonSchema.typeDefs,
      resolvers: CommonSchema.resolvers,
    });
  },
  get module() {
    return createModule({
      id: 'CommonSchema',
      typeDefs: CommonSchema.typeDefs,
      resolvers: CommonSchema.resolvers,
    });
  },
} as const;
