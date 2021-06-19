import { envelop } from '@envelop/core';
import { gql } from '@graphql-ez/core-utils/gql';
import { uniqueArray } from '@graphql-ez/core-utils/object';

import { ezCache } from './cache';
import { ezSchema } from './schema';

import type { Envelop } from '@envelop/types';
import type {
  AppOptions,
  BaseAppBuilder,
  InternalAppBuildContext,
  InternalAppBuildIntegrationContext,
  EZAppFactoryType,
  AdapterFactoryContext,
} from '@graphql-ez/core-types';

export function createEZAppFactory(
  factoryCtx: AdapterFactoryContext,
  rawOptions: AppOptions,
  {
    preBuild,
    afterBuild,
  }: {
    preBuild?: (ctx: InternalAppBuildContext) => void | Promise<void>;
    afterBuild?: (getEnveloped: Envelop, ctx: InternalAppBuildContext) => void | Promise<void>;
  } = {}
): EZAppFactoryType {
  const ezPlugins = [...(rawOptions.ez?.plugins || []), ezSchema(), ezCache()];

  const integrationName = factoryCtx.integrationName;
  for (const { name, compatibilityList } of ezPlugins) {
    if (compatibilityList && !compatibilityList.includes(integrationName)) {
      throw Error(`EZ Plugin "${name}" is not compatible with "${integrationName}"`);
    }
  }

  const options: InternalAppBuildContext['options'] = {
    ...rawOptions,
    ez: {
      plugins: ezPlugins,
    },
    envelop: {
      plugins: [...(rawOptions.envelop?.plugins || [])],
    },
  };
  const baseAppBuilder: BaseAppBuilder = {
    gql,
    registerDataLoader: null as unknown as BaseAppBuilder['registerDataLoader'],
    registerModule: null as unknown as BaseAppBuilder['registerModule'],
  };

  const ctx: InternalAppBuildContext = {
    ...factoryCtx,
    options,
    appBuilder: baseAppBuilder,
  };

  const registerPromise = Promise.all(
    ezPlugins.map(plugin => {
      return plugin.onRegister?.(ctx);
    })
  ).catch(err => {
    console.error(err);
    process.exit(1);
  });

  const appBuilder: EZAppFactoryType['appBuilder'] = async function appBuilder(buildOptions, adapterFactory) {
    await registerPromise;

    if (buildOptions.prepare) await buildOptions.prepare(baseAppBuilder);
    if (options.prepare) await options.prepare(baseAppBuilder);

    await Promise.all([
      ...ezPlugins.map(plugin => {
        return plugin.onPreBuild?.(ctx);
      }),
      preBuild?.(ctx),
    ]);

    const getEnveloped = envelop({
      plugins: uniqueArray(options.envelop.plugins),
    });

    await Promise.all([
      ...ezPlugins.map(plugin => {
        return plugin.onAfterBuild?.(getEnveloped, ctx);
      }),
      afterBuild?.(getEnveloped, ctx),
    ]);

    return {
      app: adapterFactory({
        getEnveloped,
        ctx,
      }),
      getEnveloped,
    };
  };

  async function onIntegrationRegister(integrationCtx: InternalAppBuildIntegrationContext) {
    await Promise.all(
      ezPlugins.map(plugin => {
        return plugin.onIntegrationRegister?.(ctx, integrationCtx);
      })
    );
  }

  return { ...baseAppBuilder, appBuilder, onIntegrationRegister };
}

export * from '@graphql-ez/core-types';
