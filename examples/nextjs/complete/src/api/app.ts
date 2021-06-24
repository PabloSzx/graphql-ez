import { BuildContextArgs, CreateApp, InferFunctionReturn } from '@graphql-ez/nextjs';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';

function buildContext(_args: BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

declare module '@graphql-ez/nextjs' {
  interface EZContext extends InferFunctionReturn<typeof buildContext> {}
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
