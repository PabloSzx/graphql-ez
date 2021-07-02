import { CreateApp, gql, EZContext } from '../../../../src';

function buildContext(_args: import('../../../../src').BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

export const { buildApp } = CreateApp({
  buildContext,
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
        context(_root: unknown, _args: unknown, { req, ...ctx }: EZContext) {
          return JSON.stringify(ctx);
        },
      },
    },
  },
});
