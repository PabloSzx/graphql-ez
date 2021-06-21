import { BuildContextArgs, CreateApp, gql, InferFunctionReturn } from '@graphql-ez/hapi-new';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
    foo: 'bar',
  };
}

declare module '@graphql-ez/hapi-new' {
  interface EZContext extends InferFunctionReturn<typeof buildContext> {}
}

export const { registerModule, buildApp } = CreateApp({
  buildContext,
  ez: {
    plugins: [
      ezCodegen({
        config: {
          federation: true,
          deepPartialResolvers: true,
          targetPath: './src/ez.generated.ts',
          scalars: {
            DateTime: 'string',
          },
          documents: 'src/graphql/*',
        },
        outputSchema: './schema.gql',
      }),
      ezGraphQLModules(),
      ezScalars({
        DateTime: 1,
      }),
      ezAltairIDE(),
      ezGraphiQLIDE(),
    ],
  },
  schema: {
    typeDefs: gql`
      type Query {
        hello3: String!
      }
    `,
    resolvers: {
      Query: {
        hello3(_root, _args, _ctx) {
          return 'zzz';
        },
      },
    },
  },
});

export { gql };
