import { envelop, useEnvelop } from '@envelop/core';

import { ezCoreCache } from './cache';
import { ezCoreDisableIntrospection } from './introspection';
import { ezCoreSchema } from './schema';
import { gql } from './utils/gql';
import { cleanObject, toPlural } from './utils/object';

import type {
  AppOptions,
  BaseAppBuilder,
  InternalAppBuildContext,
  InternalAppBuildIntegrationContext,
  EZAppFactoryType,
  AdapterFactoryContext,
  Envelop,
} from './index';

export function createEZAppFactory(
  factoryCtx: AdapterFactoryContext,
  rawOptionsArg: AppOptions,
  {
    preBuild,
    afterBuild,
  }: {
    preBuild?: (ctx: InternalAppBuildContext) => void | Promise<void>;
    afterBuild?: (getEnveloped: Envelop, ctx: InternalAppBuildContext) => void | Promise<void>;
  } = {}
): EZAppFactoryType {
  const presets = toPlural(rawOptionsArg.ez?.preset);
  const rawOptions: AppOptions = Object.assign({}, ...presets.map(v => v.options && cleanObject(v.options)), rawOptionsArg);

  const envelopPluginsPre = [...toPlural(rawOptions.envelop?.plugins)];
  const ezPluginsDirty = [...toPlural(rawOptions.ez?.plugins)];

  const envelopPresets = toPlural(rawOptions.envelop?.preset);

  for (const envelopPreset of envelopPresets) {
    envelopPluginsPre.unshift(useEnvelop(envelopPreset));
  }

  for (const preset of presets) {
    if (preset.self) ezPluginsDirty.push(preset.self);

    if (preset.ezPlugins) ezPluginsDirty.push(...preset.ezPlugins);

    if (preset.envelopPlugins) envelopPluginsPre.push(...preset.envelopPlugins);
  }

  const integrationName = factoryCtx.integrationName;

  const ezPluginsPre = ezPluginsDirty.filter(({ name, compatibilityList }, index) => {
    if (compatibilityList && !compatibilityList.includes(integrationName)) {
      throw Error(`[graphql-ez] "${name}" is not compatible with "${integrationName}"`);
    }

    if (ezPluginsDirty.findIndex(plugin => plugin.name === name) === index) return true;

    console.warn(`[graphql-ez] Warning! Plugin "${name}" is duplicated! Make sure to specify the same plugin only once.`);

    return false;
  });

  const envelopPlugins = [...envelopPluginsPre];
  const ezPlugins = [...ezPluginsPre];

  const baseAppBuilder: BaseAppBuilder = {
    gql,
    registerDataLoader() {
      throw Error(`To use "registerDataLoader" you have to add "ezDataLoader" plugin first!`);
    },
    registerModule() {
      throw Error(`To use "registerModule" you have to add "ezGraphQLModules" plugin first!`);
    },
    get asPreset() {
      return {
        options: { ...rawOptions, ez: undefined, envelop: undefined },
        ezPlugins: ezPluginsPre,
        envelopPlugins: envelopPluginsPre,
      };
    },
    envelopPlugins,
    ezPlugins,
  };

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
      ezCoreSchema(ctx),
      ezCoreCache(ctx),
      ezCoreDisableIntrospection(ctx),
    ]);

    const getEnveloped = envelop({
      plugins: envelopPlugins,
    });

    Object.freeze(envelopPlugins);
    Object.freeze(ezPlugins);

    if (!getEnveloped().schema) {
      throw Error('[graphql-ez] No GraphQL Schema specified!');
    }

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

export * from './types';
