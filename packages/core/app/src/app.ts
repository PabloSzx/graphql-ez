import { envelop, useEnvelop } from '@envelop/core';
import { gql } from '@graphql-ez/core-utils/gql';
import { toPlural } from '@graphql-ez/core-utils/object';

import { ezCache } from './cache';
import { ezSchema } from './schema';

import type {
  AppOptions,
  BaseAppBuilder,
  InternalAppBuildContext,
  InternalAppBuildIntegrationContext,
  EZAppFactoryType,
  AdapterFactoryContext,
  Envelop,
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
  const envelopPlugins = [...(rawOptions.envelop?.plugins || [])];
  const ezPluginsDirty = [...(rawOptions.ez?.plugins || []), ezSchema(), ezCache()];

  for (const preset of toPlural(rawOptions.ez?.preset)) {
    if (preset.self) ezPluginsDirty.push(preset.self);

    if (preset.ezPlugins) ezPluginsDirty.push(...preset.ezPlugins);

    if (preset.envelopPlugins) envelopPlugins.push(...preset.envelopPlugins);
  }

  const integrationName = factoryCtx.integrationName;

  const ezPlugins = ezPluginsDirty.filter(({ name, compatibilityList }, index) => {
    if (compatibilityList && !compatibilityList.includes(integrationName)) {
      throw Error(`[graphql-ez] "${name}" is not compatible with "${integrationName}"`);
    }

    if (ezPluginsDirty.findIndex(plugin => plugin.name === name) === index) return true;

    console.warn(`[graphql-ez] Warning! Plugin "${name}" is duplicated! Make sure to specify the same plugin only once.`);

    return false;
  });

  const envelopPresets = toPlural(rawOptions.envelop?.preset);

  const options: InternalAppBuildContext['options'] = {
    ...rawOptions,
    ez: {
      plugins: ezPlugins,
    },
    envelop: {
      plugins: envelopPlugins,
      presets: envelopPresets,
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

    envelopPlugins.unshift(...envelopPresets.map(useEnvelop));

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
