import { BuildContextArgs, CreateApp, InferFunctionReturn } from 'ez-gql/nextjs';

function buildContext(_args: BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

declare module 'ez-gql/nextjs' {
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
