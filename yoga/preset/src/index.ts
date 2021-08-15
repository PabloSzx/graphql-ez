import { toPlural } from 'graphql-ez/utils/object';
import { LazyPromise } from 'graphql-ez/utils/promise';

import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezSchema, EZSchemaOptions } from '@graphql-ez/plugin-schema';
import { ezUpload } from '@graphql-ez/plugin-upload';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';

import type { GraphQLUploadConfig } from '@graphql-ez/plugin-upload';
import type { WebSocketOptions } from '@graphql-ez/plugin-websockets';
import type { GraphiQLOptions } from '@graphql-ez/plugin-graphiql';

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
  websockets?: WebSocketOptions | boolean;

  /**
   * @default true
   */
  graphiql?: GraphiQLOptions | boolean;

  ezOptions?: EZPreset['options'];

  ezPlugins?: NullableEZPlugin[];

  envelopPlugins?: EnvelopPlugin[];
}

export function getYogaPreset(config: BaseYogaConfig = {}): EZPreset {
  const {
    upload = false,
    middlewares,
    websockets = false,
    graphiql = true,
    ezOptions,
    envelopPlugins: envelopPluginsConfig,
    ezPlugins: ezPluginsConfig,
    executableSchemaConfig,
    mergeSchemasConfig,
    schema,
  } = config;

  const ezPlugins: NullableEZPlugin[] = [...toPlural(ezPluginsConfig)];
  const envelopPlugins: PromiseOrValue<EnvelopPlugin>[] = [...toPlural(envelopPluginsConfig)];

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
