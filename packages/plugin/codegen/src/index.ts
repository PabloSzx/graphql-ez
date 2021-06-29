import { toPlural } from 'graphql-ez/utils/object';

import type { EZPlugin } from 'graphql-ez';
import type { CodegenConfig } from './typescript';

export interface CodegenOptions {
  /**
   * Enable code generation, by default is enabled if `NODE_ENV` is not `production` nor `test`
   *
   * @default process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test"
   */
  enableCodegen?: boolean;

  /**
   * Add custom codegen config
   */
  config?: CodegenConfig;

  /**
   * Output schema target path or flag
   *
   * If `true`, defaults to `"./schema.gql"`
   * You have to specify a `.gql`, `.graphql` or `.json` extension
   *
   * @default false
   */
  outputSchema?: boolean | string | string[];
}

declare module 'graphql-ez/types/index' {
  interface InternalAppBuildContext {
    codegen?: CodegenOptions;
  }
}

export const ezCodegen = (options: CodegenOptions = {}): EZPlugin => {
  return {
    name: 'GraphQL Codegen',
    onRegister(ctx) {
      ctx.codegen = options;
    },
    onAfterBuild(getEnveloped, ctx) {
      const {
        config: { onError = console.error, onFinish } = {},
        outputSchema,
        enableCodegen = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
      } = options;

      if (!enableCodegen) return onFinish?.();

      const { schema } = getEnveloped();

      Promise.all([
        outputSchema
          ? import('./outputSchema').then(({ writeOutputSchema }) => {
              return Promise.all(toPlural(outputSchema).map(format => writeOutputSchema(schema, format))).catch(onError);
            })
          : null,

        import('./typescript').then(({ EnvelopTypeScriptCodegen }) => {
          return EnvelopTypeScriptCodegen(schema, ctx).catch(onError);
        }),
      ]).then(onFinish, onError);
    },
  };
};
