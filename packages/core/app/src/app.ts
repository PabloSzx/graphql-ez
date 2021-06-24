import { envelop, useEnvelop } from '@envelop/core';
import { gql } from '@graphql-ez/core-utils/gql';
import { toPlural, uniqueArray } from '@graphql-ez/core-utils/object';

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
      presets: rawOptions.envelop?.presets || [],
    },
  };
  const baseAppBuilder: BaseAppBuilder = {
    gql,
    registerDataLoader() {
      throw Error(`To use "registerDataLoader" you have to add "ezDataLoader" plugin first!`);
    },
    registerModule() {
      throw Error(`To use "registerModule" you have to add "ezGraphQLModules" plugin first!`);
    },
  };

  const ctx: InternalAppBuildContext = {
    ...factoryCtx,
    options,
    appBuilder: baseAppBuilder,
  };

  let registerError: unknown;
  const registerPromise = Promise.all(
    ezPlugins.map(plugin => {
      return plugin.onRegister?.(ctx);
    })
  ).catch(err => {
    registerError = err;
  });

  const appBuilder: EZAppFactoryType['appBuilder'] = async function appBuilder(buildOptions = {}, adapterFactory) {
    await registerPromise;

    if (registerError) throw registerError;

    if (buildOptions.prepare) await buildOptions.prepare(baseAppBuilder);
    if (options.prepare) await options.prepare(baseAppBuilder);

    await Promise.all([
      ...ezPlugins.map(plugin => {
        return plugin.onPreBuild?.(ctx);
      }),
      preBuild?.(ctx),
    ]);

    const envelopPlugins = uniqueArray(options.envelop.plugins);

    envelopPlugins.unshift(...toPlural(options.envelop.presets).map(useEnvelop));

    const getEnveloped = envelop({
      plugins: envelopPlugins,
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
