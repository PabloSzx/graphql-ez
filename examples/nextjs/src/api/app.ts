import { BuildContextArgs, CreateApp, InferFunctionReturn } from '@graphql-ez/nextjs';

function buildContext(_args: BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

declare module '@graphql-ez/nextjs' {
  interface EnvelopContext extends InferFunctionReturn<typeof buildContext> {}
}

export const { buildApp, registerModule, gql } = CreateApp({
  buildContext,
  codegen: {
    preImportCode: `
    /* eslint-disable no-use-before-define */
    `,
    documents: 'src/graphql/*',
  },
});
