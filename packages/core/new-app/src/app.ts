import { envelop } from '@envelop/core';
import { gql } from '@graphql-ez/core-utils/gql';
import { uniqueArray } from '@graphql-ez/core-utils/object';

import type { Envelop } from '@envelop/types';
import type { AppOptions, PickRequired } from './types';

export interface BaseAppBuilder {
  /**
   * GraphQL Tag Parser
   */
  gql: typeof gql;
}

export interface AdapterFactoryArgs {
  envelop: Envelop<unknown>;
  ctx: InternalAppBuildContext;
}

export type AdapterFactory<T> = (args: AdapterFactoryArgs) => T;

export interface EZPlugin {
  onRegister?(ctx: InternalAppBuildContext): void | Promise<void>;
  onPreBuild?(ctx: InternalAppBuildContext): void | Promise<void>;
  onAfterBuild?(getEnveloped: Envelop, ctx: InternalAppBuildContext): void | Promise<void>;
}

export interface InternalAppBuildContext {
  options: PickRequired<AppOptions, 'ez' | 'envelop'>;
  appBuilder: BaseAppBuilder;
}

export interface BuiltApp<T> {
  app: T;
  getEnveloped: Envelop<unknown>;
}

export interface EnvelopAppFactoryType extends BaseAppBuilder {
  appBuilder<T>(factory: AdapterFactory<T>): Promise<BuiltApp<T>>;
}

export function createEnvelopAppFactory(
  rawOptions: AppOptions,
  {
    preBuild,
    afterBuild,
  }: {
    preBuild?: (ctx: InternalAppBuildContext) => void | Promise<void>;
    afterBuild?: (getEnveloped: Envelop, ctx: InternalAppBuildContext) => void | Promise<void>;
  } = {}
): EnvelopAppFactoryType {
  const options = {
    ...rawOptions,
    ez: {
      plugins: [...(rawOptions.ez?.plugins || [])],
    },
    envelop: {
      plugins: [...(rawOptions.envelop?.plugins || [])],
    },
  };
  const baseAppBuilder: BaseAppBuilder = {
    gql,
  };

  const ctx: InternalAppBuildContext = {
    options,
    appBuilder: baseAppBuilder,
  };

  const registerPromise = Promise.all(
    options.ez.plugins.map(plugin => {
      return plugin.onRegister?.(ctx);
    })
  ).catch(err => {
    console.error(err);
    process.exit(1);
  });

  const appBuilder: EnvelopAppFactoryType['appBuilder'] = async function appBuilder(adapterFactory) {
    await registerPromise;

    if (options.prepare) await options.prepare(baseAppBuilder);

    return getApp();

    async function getApp() {
      await Promise.all([
        ...options.ez.plugins.map(plugin => {
          return plugin.onPreBuild?.(ctx);
        }),
        preBuild?.(ctx),
      ]);

      const getEnveloped = envelop({
        plugins: uniqueArray(options.envelop.plugins),
      });

      await Promise.all([
        ...options.ez.plugins.map(async plugin => {
          return plugin.onAfterBuild?.(getEnveloped, ctx);
        }),
        afterBuild?.(getEnveloped, ctx),
      ]);

      return {
        app: adapterFactory({
          envelop: getEnveloped,
          ctx,
        }),
        getEnveloped,
      };
    }
  };

  return { ...baseAppBuilder, appBuilder };
}

export * from './types';
