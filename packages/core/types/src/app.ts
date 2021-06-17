import type { gql } from '@graphql-ez/core-utils/gql';
import type { Envelop, Plugin } from '@envelop/types';
import type { PickRequired } from './utils';
import type { IncomingMessage } from 'http';
import type { HandleRequest } from './request';
import type { InternalAppBuildContext, BaseAppBuilder } from './index';

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

export interface AdapterFactoryContext {
  moduleName: 'express' | 'fastify' | 'nextjs' | 'http' | 'koa' | 'hapi' | 'core';
}

declare module './index' {
  export interface BaseAppBuilder {
    /**
     * GraphQL Tag Parser
     */
    gql: typeof gql;
  }

  interface InternalAppBuildContext extends AdapterFactoryContext {
    options: PickRequired<AppOptions, 'ez' | 'envelop'>;
    appBuilder: BaseAppBuilder;
  }

  export interface AppOptions {
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

  export interface BuildContextArgs {
    req: IncomingMessage;
  }
}

export interface BuiltApp<T> {
  app: T;
  getEnveloped: Envelop<unknown>;
}

export interface EnvelopAppFactoryType extends BaseAppBuilder {
  appBuilder<T>(factory: AdapterFactory<T>): Promise<BuiltApp<T>>;
}
