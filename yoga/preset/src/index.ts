import { CodegenOptions, ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE, GraphiQLOptions } from '@graphql-ez/plugin-graphiql';
import { ezSchema, EZSchemaOptions } from '@graphql-ez/plugin-schema';
import { ezUpload, GraphQLUploadConfig } from '@graphql-ez/plugin-upload';
import { ezWebSockets, WebSocketOptions } from '@graphql-ez/plugin-websockets';
import { LazyPromise } from '@graphql-ez/utils/promise';

import type { IMocks, IMockStore, TypePolicy } from '@graphql-tools/mock';
import type { EZPreset, Plugin as EnvelopPlugin, PromiseOrValue, NullableEZPlugin, EZResolvers } from 'graphql-ez';

import type { IMiddleware, IMiddlewareGenerator } from 'graphql-middleware';

export interface BaseYogaConfig extends EZSchemaOptions {
  /**
   * @default false
   */
  uploads?: GraphQLUploadConfig;

  middlewares?: Array<IMiddleware | IMiddlewareGenerator<any, any, any>>;

  /**
   * @default false
   */
  codegen?: CodegenOptions | boolean;

  /**
   * @default false
   */
  websockets?: WebSocketOptions | boolean;

  /**
   * @default true
   */
  graphiql?: GraphiQLOptions | boolean;

  /**
   * Applies `mocks` to schema, check https://www.graphql-tools.com/docs/mocking
   */
  mocks?:
    | {
        store?: IMockStore;
        mocks?: IMocks;
        typePolicies?: {
          [typeName: string]: TypePolicy;
        };
        resolvers?: EZResolvers | ((store: IMockStore) => EZResolvers);
        /**
         * Set to `true` to prevent existing resolvers from being
         * overwritten to provide mock data. This can be used to mock some parts of the
         * server and not others.
         *
         * @default false
         */
        preserveResolvers?: boolean;
      }
    | boolean;
}

export interface PresetConfig {
  ezOptions?: EZPreset['options'];
}

export function getYogaPreset(config: BaseYogaConfig & PresetConfig = {}): EZPreset {
  const {
    uploads = false,
    middlewares,
    codegen = false,
    websockets = false,
    graphiql = true,
    ezOptions,

    executableSchemaConfig,
    mergeSchemasConfig,
    schema,
    mocks,
    transformFinalSchema,
  } = config;

  const ezPlugins: NullableEZPlugin[] = [];
  const envelopPlugins: PromiseOrValue<EnvelopPlugin>[] = [];

  const preset: Required<EZPreset> = {
    options: { ...ezOptions },
    self: {
      name: 'YogaPreset',
    },
    envelopPlugins,
    ezPlugins,
  };

  {
    const ezSchemaOptions: EZSchemaOptions = {
      schema,
      executableSchemaConfig,
      mergeSchemasConfig,
      transformFinalSchema: mocks
        ? async schema => {
            const { addMocksToSchema } = await import('@graphql-tools/mock');
            const mockedSchema = addMocksToSchema({
              schema,
              ...(typeof mocks === 'object' ? mocks : {}),
            });

            if (transformFinalSchema) return transformFinalSchema(mockedSchema);

            return mockedSchema;
          }
        : transformFinalSchema,
    };

    ezPlugins.push(ezSchema(ezSchemaOptions));
  }

  if (graphiql) {
    ezPlugins.push(ezGraphiQLIDE(graphiql));
  }

  if (codegen) {
    ezPlugins.push(ezCodegen(typeof codegen === 'object' ? codegen : undefined));
  }

  if (uploads) {
    ezPlugins.push(ezUpload(uploads));
  }

  if (websockets) {
    ezPlugins.push(ezWebSockets(typeof websockets === 'boolean' ? 'adaptive' : websockets));
  }

  if (middlewares) {
    envelopPlugins.push(LazyPromise(() => import('@envelop/graphql-middleware').then(v => v.useGraphQLMiddleware(middlewares))));
  }

  return preset;
}
