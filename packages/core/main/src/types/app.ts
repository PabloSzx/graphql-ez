import type { GetEnvelopedFn, Plugin } from '@envelop/types';
import type { DocumentNode, GraphQLSchema } from 'graphql';
import type { IncomingMessage } from 'http';
import type { InternalAppBuildContextKey } from '../app';
import type {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  EZContext,
  InternalAppBuildContext,
  InternalAppBuildIntegrationContext,
  PromiseOrValue,
} from '../index';
import type { HandleRequest, PreProcessRequest } from './request';
export interface AdapterFactoryArgs {
  getEnveloped: GetEnvelopedFn<unknown>;
  ctx: InternalAppBuildContext;
}

export type AdapterFactory<T> = (args: AdapterFactoryArgs) => T;

interface BaseEZPlugin {
  readonly name: string;

  readonly onRegister?: (ctx: InternalAppBuildContext) => void | Promise<void>;
  readonly onPreBuild?: (ctx: InternalAppBuildContext) => void | Promise<void>;
  readonly onAfterBuild?: (getEnveloped: GetEnvelopedFn<unknown>, ctx: InternalAppBuildContext) => void | Promise<void>;
}

export type IntegrationRegisterHandler<Integration extends IntegrationsNames> = (args: {
  ctx: InternalAppBuildContext;
  integration: NonNullable<InternalAppBuildIntegrationContext[Integration]>;
}) => void | Promise<void>;

export type EZPlugin =
  | (BaseEZPlugin & {
      readonly compatibilityList?: { readonly [Integration in IntegrationsNames]?: boolean | Error };
      readonly onIntegrationRegister?: undefined;
    })
  | (BaseEZPlugin & {
      /**
       * List all the integrations this plugin supports
       */
      readonly compatibilityList: { readonly [Integration in IntegrationsNames]?: boolean | Error };
      readonly onIntegrationRegister: (ctx: InternalAppBuildContext) => PromiseOrValue<
        | {
            [integrationCallback in IntegrationsNames]?: IntegrationRegisterHandler<integrationCallback>;
          }
        | undefined
      >;
    });

export type NullableEZPlugin = EZPlugin | null | undefined | boolean;

export type NullableEnvelopPlugin = PromiseOrValue<Plugin<any> | null | undefined | boolean>;

export type EZPreset = {
  self?: EZPlugin;

  options?: AppOptions & { ez?: never; envelop?: never };

  ezPlugins?: NullableEZPlugin[];
  envelopPlugins?: NullableEnvelopPlugin[];
};

export type IntegrationsNames =
  | 'express'
  | 'fastify'
  | 'nextjs'
  | 'http'
  | 'koa'
  | 'hapi'
  | 'cloudflare'
  | 'sveltekit'
  | 'vercel';

export interface AdapterFactoryContext {
  integrationName: IntegrationsNames;
}

declare module '../index' {
  interface BaseAppBuilder {
    /**
     * GraphQL Tag Parser
     */
    gql(literals: string | readonly string[], ...args: any[]): DocumentNode;

    /**
     * Get EZ Application back as a preset to be used in another app instance
     *
     * `It only includes the options, plugins and presets of the original configuration.`
     *
     * `Modules and Plugins added by mutating "ezPlugins", "envelopPlugins" or calling "register___" helpers are not included.`
     */
    asPreset: EZPreset;

    ezPlugins: readonly EZPlugin[];

    /**
     * Mutate this array to add Envelop plugins on the fly
     *
     * `You can only mutate this array before calling "buildApp" on in the "prepare" option.`
     */
    envelopPlugins: NullableEnvelopPlugin[];

    [InternalAppBuildContextKey]: InternalAppBuildContext;
  }

  interface ContextAppOptions extends Omit<AppOptions, 'ez' | 'envelop'> {
    ez: {
      plugins: readonly EZPlugin[];
    };
    envelop: {
      plugins: NullableEnvelopPlugin[];
      presets: GetEnvelopedFn<unknown>[];

      enableInternalTracing?: boolean;
    };
  }

  interface InternalAppBuildContext extends AdapterFactoryContext {
    options: ContextAppOptions;
    appBuilder: BaseAppBuilder;
    preProcessRequest?: PreProcessRequest[];
  }

  interface BuildAppOptions {
    prepare?: (appBuilder: BaseAppBuilder) => void | Promise<void>;
  }

  interface RequiredCtxAppOptions {
    envelop: NonNullable<Required<AppOptions['envelop']>>;
    ez: NonNullable<Required<AppOptions['ez']>>;
  }

  interface AppOptions {
    /**
     * Set GraphQL Schema
     *
     * __Set "schema" to `"dynamic"` to disable static schema validation.
     */
    schema?: GraphQLSchema | Promise<GraphQLSchema> | 'dynamic';

    /**
     * Callback to be called right before building app
     */
    prepare?: (appBuilder: BaseAppBuilder) => void | Promise<void>;

    /**
     * Custom Envelop Plugins
     */
    envelop?: {
      plugins?: NullableEnvelopPlugin[];

      preset?: GetEnvelopedFn<unknown> | GetEnvelopedFn<unknown>[];

      enableInternalTracing?: boolean;
    };

    /**
     * Custom EZ Plugins
     *
     * Any value in the plugin list that isn't an object is automatically filtered out
     */
    ez?: {
      plugins?: NullableEZPlugin[];

      preset?: EZPreset | EZPreset[];
    };

    /**
     * **Advanced usage only**
     *
     * Override `handleRequest` logic
     */
    customHandleRequest?: HandleRequest;

    /**
     * Allow batched queries
     *
     * > Specify a number to set the maximum (inclusive) amount of batched queries allowed
     *
     * @default false
     */
    allowBatchedQueries?: boolean | number;

    /**
     * Build Context
     */
    buildContext?: (args: BuildContextArgs) => Record<string, unknown> | Promise<Record<string, unknown>>;

    /**
     * Custom on app register callback with access to internal build context
     */
    onAppRegister?: (args: {
      ctx: InternalAppBuildContext;
      integration: InternalAppBuildIntegrationContext;
      getEnveloped: GetEnvelopedFn<unknown>;
    }) => void | Promise<void>;
  }

  interface BuildContextArgs {
    req: IncomingMessage;
  }

  interface EZContext {
    req: IncomingMessage;
  }
}

export interface BuiltEZApp<T> {
  app: T;
  getEnveloped: GetEnvelopedFn<unknown>;
}

export interface EZAppFactoryType extends BaseAppBuilder {
  appBuilder<T>(buildOptions: BuildAppOptions, factory: AdapterFactory<T>): Promise<BuiltEZApp<T>>;
  onIntegrationRegister(integrationCtx: InternalAppBuildIntegrationContext): Promise<void>;
}

declare module '@envelop/types' {
  interface DefaultContext extends EZContext {}
}
