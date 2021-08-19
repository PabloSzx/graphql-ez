import { LazyPromise } from '@graphql-ez/utils/promise';

import { CodegenOptions, ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE, GraphiQLOptions } from '@graphql-ez/plugin-graphiql';
import { ezSchema, EZSchemaOptions } from '@graphql-ez/plugin-schema';
import { ezUpload, GraphQLUploadConfig } from '@graphql-ez/plugin-upload';
import { ezWebSockets, WebSocketOptions } from '@graphql-ez/plugin-websockets';

import type { EZPreset, Plugin as EnvelopPlugin, PromiseOrValue, NullableEZPlugin } from 'graphql-ez';

import type { IMiddleware, IMiddlewareGenerator } from 'graphql-middleware';

export interface BaseYogaConfig extends EZSchemaOptions {
  /**
   * @default false
   */
  upload?: GraphQLUploadConfig;

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
}

export interface PresetConfig {
  ezOptions?: EZPreset['options'];
}

export function getYogaPreset(config: BaseYogaConfig & PresetConfig = {}): EZPreset {
  const {
    upload = false,
    middlewares,
    codegen = false,
    websockets = false,
    graphiql = true,
    ezOptions,

    executableSchemaConfig,
    mergeSchemasConfig,
    schema,
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

  ezPlugins.push(
    ezSchema({
      schema,
      executableSchemaConfig,
      mergeSchemasConfig,
    })
  );

  if (graphiql) {
    ezPlugins.push(ezGraphiQLIDE(graphiql));
  }

  if (codegen) {
    ezPlugins.push(ezCodegen(typeof codegen === 'object' ? codegen : undefined));
  }

  if (upload) {
    ezPlugins.push(ezUpload(upload));
  }

  if (websockets) {
    ezPlugins.push(ezWebSockets(typeof websockets === 'boolean' ? 'adaptive' : websockets));
  }

  if (middlewares) {
    envelopPlugins.push(LazyPromise(() => import('@envelop/graphql-middleware').then(v => v.useGraphQLMiddleware(middlewares))));
  }

  return preset;
}
