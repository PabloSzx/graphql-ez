import { BuildContextArgs, CreateApp, InferFunctionReturn } from '@graphql-ez/nextjs-new';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';

function buildContext(_args: BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

declare module '@graphql-ez/nextjs-new' {
  interface EnvelopContext extends InferFunctionReturn<typeof buildContext> {}
}

export const { buildApp, registerModule, gql } = CreateApp({
  buildContext,
  ez: {
    plugins: [
      ezCodegen({
        config: {
          documents: 'src/graphql/*',
        },
      }),
      ezGraphQLModules(),
    ],
  },
});
