import type { Envelop, Plugin } from '@envelop/types';
import type { IncomingMessage } from 'http';
import type { HandleRequest } from './request';
import type {
  InternalAppBuildContext,
  BaseAppBuilder,
  BuildAppOptions,
  InternalAppBuildIntegrationContext,
  AppOptions,
} from './index';
import type { DocumentNode } from 'graphql';

export interface AdapterFactoryArgs {
  getEnveloped: Envelop;
  ctx: InternalAppBuildContext;
}

export type AdapterFactory<T> = (args: AdapterFactoryArgs) => T;

interface BaseEZPlugin {
  readonly name: string;

  readonly onRegister?: (ctx: InternalAppBuildContext) => void | Promise<void>;
  readonly onPreBuild?: (ctx: InternalAppBuildContext) => void | Promise<void>;
  readonly onAfterBuild?: (getEnveloped: Envelop, ctx: InternalAppBuildContext) => void | Promise<void>;
}

export type EZPlugin =
  | (BaseEZPlugin & {
      readonly compatibilityList?: readonly IntegrationsNames[];
      readonly onIntegrationRegister?: undefined;
    })
  | (BaseEZPlugin & {
      /**
       * List all the integrations this plugin supports
       */
      readonly compatibilityList: readonly IntegrationsNames[];
      readonly onIntegrationRegister: (
        ctx: InternalAppBuildContext,
        integrationCtx: InternalAppBuildIntegrationContext
      ) => void | Promise<void>;
    });

export type EZPreset = {
  self?: EZPlugin;

  options?: AppOptions & { ez?: never; envelop?: never };

  ezPlugins?: EZPlugin[];
  envelopPlugins?: Plugin[];
};

export type IntegrationsNames = 'express' | 'fastify' | 'nextjs' | 'http' | 'koa' | 'hapi' | 'core';
export interface AdapterFactoryContext {
  integrationName: IntegrationsNames;
}

declare module './index' {
  interface BaseAppBuilder {
    /**
     * GraphQL Tag Parser
     */
    gql(literals: string | readonly string[], ...args: any[]): DocumentNode;

    /**
     * Get EZ Application back as a preset to be used in another app instance
     */
    asPreset: EZPreset;
  }

  interface ContextAppOptions extends Omit<AppOptions, 'ez' | 'envelop'> {
    ez: {
      plugins: EZPlugin[];
    };
    envelop: {
      plugins: Plugin[];
      presets: Envelop[];
    };
  }

  interface InternalAppBuildContext extends AdapterFactoryContext {
    options: ContextAppOptions;
    appBuilder: BaseAppBuilder;
  }

  interface BuildAppOptions {
    prepare?: (appBuilder: BaseAppBuilder) => void | Promise<void>;
  }

  interface RequiredCtxAppOptions {
    envelop: NonNullable<Required<AppOptions['envelop']>>;
    ez: NonNullable<Required<AppOptions['ez']>>;
  }

  interface AppOptions {
    prepare?: (appBuilder: BaseAppBuilder) => void | Promise<void>;

    /**
     * Custom Envelop Plugins
     */
    envelop?: {
      plugins?: Plugin[];

      preset?: Envelop | Envelop[];
    };

    /**
     * Custom EZ Plugins
     */
    ez?: {
      plugins?: EZPlugin[];

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
      getEnveloped: Envelop;
    }) => void | Promise<void>;
  }

  interface BuildContextArgs {
    req: IncomingMessage;
  }
}

export interface BuiltEZApp<T> {
  app: T;
  getEnveloped: Envelop;
}

export interface EZAppFactoryType extends BaseAppBuilder {
  appBuilder<T>(buildOptions: BuildAppOptions, factory: AdapterFactory<T>): Promise<BuiltEZApp<T>>;
  onIntegrationRegister(integrationCtx: InternalAppBuildIntegrationContext): Promise<void>;
}
