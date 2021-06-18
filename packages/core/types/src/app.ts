import type { gql } from '@graphql-ez/core-utils/gql';
import type { Envelop, Plugin } from '@envelop/types';
import type { PickRequired } from './utils';
import type { IncomingMessage } from 'http';
import type { HandleRequest } from './request';
import type { InternalAppBuildContext, BaseAppBuilder, BuildAppOptions, InternalAppBuildIntegrationContext } from './index';

export interface AdapterFactoryArgs {
  getEnveloped: Envelop<unknown>;
  ctx: InternalAppBuildContext;
}

export type AdapterFactory<T> = (args: AdapterFactoryArgs) => T;

export interface EZPlugin {
  onRegister?(ctx: InternalAppBuildContext): void | Promise<void>;
  onIntegrationRegister?(ctx: InternalAppBuildContext, integrationCtx: InternalAppBuildIntegrationContext): void | Promise<void>;
  onPreBuild?(ctx: InternalAppBuildContext): void | Promise<void>;
  onAfterBuild?(getEnveloped: Envelop, ctx: InternalAppBuildContext): void | Promise<void>;
}

export interface AdapterFactoryContext {
  moduleName: 'express' | 'fastify' | 'nextjs' | 'http' | 'koa' | 'hapi' | 'core';
}

declare module './index' {
  interface BaseAppBuilder {
    /**
     * GraphQL Tag Parser
     */
    gql: typeof gql;
  }

  interface BaseEZApp {
    getEnveloped: Promise<Envelop<unknown>>;
  }

  interface InternalAppBuildContext extends AdapterFactoryContext {
    options: PickRequired<AppOptions, 'ez' | 'envelop'>;
    appBuilder: BaseAppBuilder;
  }

  interface BuildAppOptions {
    prepare?: (appBuilder: BaseAppBuilder) => void | Promise<void>;
  }

  interface AppOptions {
    prepare?: (appBuilder: BaseAppBuilder) => void | Promise<void>;

    /**
     * Custom Envelop Plugins
     */
    envelop?: {
      plugins?: Plugin[];
    };

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

export interface BuiltApp<T> {
  app: T;
  getEnveloped: Envelop<unknown>;
}

export interface EnvelopAppFactoryType extends BaseAppBuilder {
  appBuilder<T>(buildOptions: BuildAppOptions, factory: AdapterFactory<T>): Promise<BuiltApp<T>>;
  onIntegrationRegister(integrationCtx: InternalAppBuildIntegrationContext): Promise<void>;
}
