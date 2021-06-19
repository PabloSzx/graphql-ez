import type { Envelop, Plugin } from '@envelop/types';
import type { IncomingMessage } from 'http';
import type { HandleRequest } from './request';
import type { InternalAppBuildContext, BaseAppBuilder, BuildAppOptions, InternalAppBuildIntegrationContext } from './index';
import type { DocumentNode } from 'graphql';

export interface AdapterFactoryArgs {
  getEnveloped: Envelop<unknown>;
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
      readonly compatibilityList?: undefined;
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

export type IntegrationsNames = 'express-new' | 'fastify-new' | 'nextjs' | 'http' | 'koa' | 'hapi' | 'core';
export interface AdapterFactoryContext {
  integrationName: IntegrationsNames;
}

declare module './index' {
  interface BaseAppBuilder {
    /**
     * GraphQL Tag Parser
     */
    gql(literals: string | readonly string[], ...args: any[]): DocumentNode;
  }

  interface InternalAppBuildContext extends AdapterFactoryContext {
    options: Omit<AppOptions, 'ez' | 'envelop'> & RequiredCtxAppOptions;
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
    };

    /**
     * Custom EZ Plugins
     */
    ez?: {
      plugins?: EZPlugin[];
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
  }

  interface BuildContextArgs {
    req: IncomingMessage;
  }
}

export interface BuiltEZApp<T> {
  app: T;
  getEnveloped: Envelop<unknown>;
}

export interface EZAppFactoryType extends BaseAppBuilder {
  appBuilder<T>(buildOptions: BuildAppOptions, factory: AdapterFactory<T>): Promise<BuiltEZApp<T>>;
  onIntegrationRegister(integrationCtx: InternalAppBuildIntegrationContext): Promise<void>;
}
