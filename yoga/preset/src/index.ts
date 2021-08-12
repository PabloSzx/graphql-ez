import { toPlural } from 'graphql-ez/utils/object';
import { LazyPromise } from 'graphql-ez/utils/promise';

import type { GraphQLUploadConfig } from '@graphql-ez/plugin-upload';
import type { WebSocketOptions } from '@graphql-ez/plugin-websockets';
import type { GraphiQLOptions } from '@graphql-ez/plugin-graphiql';

import type { EZPreset, PickRequired, Plugin as EnvelopPlugin, EZPlugin, PromiseOrValue } from 'graphql-ez';

import type { IMiddleware, IMiddlewareGenerator } from 'graphql-middleware';

export interface BaseYogaConfig {
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

  ezPlugins?: EZPlugin[];

  envelopPlugins?: EnvelopPlugin[];
}

export async function getYogaPreset(config: BaseYogaConfig = {}): Promise<EZPreset> {
  const { upload = false, middlewares, websockets = false, graphiql = false, ezOptions, envelopPlugins, ezPlugins } = config;

  const ezPluginsPromise: PromiseOrValue<EZPlugin>[] = [...toPlural(ezPlugins)];
  const envelopPluginsPromise: PromiseOrValue<EnvelopPlugin>[] = [...toPlural(envelopPlugins)];

  const preset: PickRequired<EZPreset, 'self' | 'options'> = {
    options: { ...ezOptions },
    self: {
      name: 'YogaPreset',
    },
  };

  if (graphiql) {
    ezPluginsPromise.push(LazyPromise(() => import('@graphql-ez/plugin-graphiql').then(v => v.ezGraphiQLIDE(graphiql))));
  }

  if (upload) {
    ezPluginsPromise.push(LazyPromise(() => import('@graphql-ez/plugin-upload').then(v => v.ezUpload(upload))));
  }

  if (websockets) {
    ezPluginsPromise.push(
      LazyPromise(() =>
        import('@graphql-ez/plugin-websockets').then(v =>
          v.ezWebSockets(typeof websockets === 'boolean' ? 'adaptive' : websockets)
        )
      )
    );
  }

  if (middlewares) {
    envelopPluginsPromise.push(
      LazyPromise(() => import('@envelop/graphql-middleware').then(v => v.useGraphQLMiddleware(middlewares)))
    );
  }

  [preset.ezPlugins, preset.envelopPlugins] = await Promise.all([
    Promise.all(ezPluginsPromise),
    Promise.all(envelopPluginsPromise),
  ]);

  return preset;
}
