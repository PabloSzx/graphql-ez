import { envelop, useEnvelop, useSchema } from '@envelop/core';

import { SmartCacheIntrospection } from './smart-cache';
import { gql } from './utils';
import { cleanObject, toPlural } from '@graphql-ez/utils/object';

import type {
  AppOptions,
  BaseAppBuilder,
  InternalAppBuildContext,
  InternalAppBuildIntegrationContext,
  EZAppFactoryType,
  AdapterFactoryContext,
  GetEnvelopedFn,
  EZPlugin,
} from './index';

export const InternalAppBuildContextKey = Symbol('graphql-ez-internal-app-build-context');

export function createEZAppFactory(
  factoryCtx: AdapterFactoryContext,
  rawOptionsArg: AppOptions,
  {
    preBuild,
    afterBuild,
  }: {
    preBuild?: (ctx: InternalAppBuildContext) => void | Promise<void>;
    afterBuild?: (getEnveloped: GetEnvelopedFn<unknown>, ctx: InternalAppBuildContext) => void | Promise<void>;
  } = {}
): EZAppFactoryType {
  const presets = toPlural(rawOptionsArg.ez?.preset);
  const rawOptions: AppOptions = {
    ...Object.assign(rawOptionsArg, ...presets.map(v => v.options && cleanObject(v.options)), { ...rawOptionsArg }),
  };

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

  const ezPluginsPre = ezPluginsDirty.filter((pluginValue, index): pluginValue is EZPlugin => {
    if (typeof pluginValue !== 'object' || pluginValue == null) return false;

    const { name, compatibilityList } = pluginValue;
    if (compatibilityList) {
      const isCompatible = compatibilityList[integrationName];

      if (isCompatible instanceof Error) throw isCompatible;
      else if (!isCompatible) throw Error(`[graphql-ez] "${name}" is not compatible with "${integrationName}"`);
    }

    if (ezPluginsDirty.findIndex(plugin => typeof plugin === 'object' && plugin != null && plugin.name === name) === index)
      return true;

    console.warn(`[graphql-ez] Warning! Plugin "${name}" is duplicated! Make sure to specify the same plugin only once.`);

    return false;
  });

  const envelopPlugins = [...envelopPluginsPre];
  const ezPlugins = Object.freeze([...ezPluginsPre]);

  const baseAppBuilder: BaseAppBuilder = {
    gql,
    registerDataLoader() {
      throw Error(`[graphql-ez] To use "registerDataLoader" you have to add the "ezDataLoader" plugin first!`);
    },
    registerModule() {
      throw Error(`[graphql-ez] To use "registerModule" you have to add the "ezGraphQLModules" plugin first!`);
    },
    registerTypeDefs() {
      throw Error(`[graphql-ez] To use "registerTypeDefs" you have to add the "ezSchema" plugin first!`);
    },
    registerResolvers() {
      throw Error(`[graphql-ez] To use "registerResolvers" you have to add the "ezSchema" plugin first!`);
    },
    get asPreset() {
      return {
        options: cleanObject({ ...rawOptions, ez: undefined, envelop: undefined }),
        ezPlugins: [...ezPluginsPre],
        envelopPlugins: [...envelopPluginsPre],
      };
    },
    envelopPlugins,
    ezPlugins,
    [InternalAppBuildContextKey]: null as any,
  };

  const options: InternalAppBuildContext['options'] = {
    ...rawOptions,
    ez: {
      plugins: ezPlugins,
    },
    envelop: {
      plugins: envelopPlugins,
      presets: envelopPresets,
      enableInternalTracing: rawOptions.envelop?.enableInternalTracing,
    },
  };

  const ctx: InternalAppBuildContext = {
    ...factoryCtx,
    options,
    appBuilder: baseAppBuilder,
  };

  baseAppBuilder[InternalAppBuildContextKey] = ctx;

  let registerError: unknown;
  const registerPromise = Promise.all(
    ezPlugins.map(plugin => {
      return plugin.onRegister?.(ctx);
    })
  ).catch(err => {
    registerError = err;
  });

  let isBuilt = false;

  const appBuilder: EZAppFactoryType['appBuilder'] = async function appBuilder(buildOptions = {}, adapterFactory) {
    if (isBuilt) throw Error(`[graphql-ez] You can't call "buildApp" more than once for a single EZ App instance.`);
    isBuilt = true;

    await registerPromise;

    if (registerError) throw registerError;

    if (buildOptions.prepare) await buildOptions.prepare(baseAppBuilder);
    if (options.prepare) await options.prepare(baseAppBuilder);

    await Promise.all([
      ...ezPlugins.map(plugin => {
        return plugin.onPreBuild?.(ctx);
      }),
      preBuild?.(ctx),
      SmartCacheIntrospection()(ctx),
    ]);

    if (!ctx.schemaPlugin && options.schema && options.schema !== 'dynamic') {
      envelopPlugins.push(useSchema(await options.schema));
    }

    Object.freeze(envelopPlugins);

    const getEnveloped = envelop({
      plugins: await Promise.all(envelopPlugins),
      enableInternalTracing: ctx.options.envelop.enableInternalTracing,
    });

    if (options.schema !== 'dynamic' && !getEnveloped().schema) {
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
    const integration: any = integrationCtx[integrationName];

    if (integration == null) throw Error(`Error on @graphql-ez/${integrationName}!`);

    await Promise.all(
      ezPlugins.map(async ({ onIntegrationRegister }) => {
        if (!onIntegrationRegister) return;

        const integrationCallback = (await onIntegrationRegister(ctx))?.[integrationName];

        return integrationCallback?.({
          ctx,
          integration,
        });
      })
    );
  }

  return { ...baseAppBuilder, appBuilder, onIntegrationRegister };
}

export * from './types';
