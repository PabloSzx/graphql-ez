import type { IncomingHttpHeaders, IncomingMessage } from 'http';
import type { ExecutionContext as HelixExecutionContext } from 'graphql-helix';
import type { handleRequest } from './request';
import type { BaseAppBuilder, EZPlugin } from './app';
import type { Plugin } from '@envelop/types';

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
  customHandleRequest?: typeof handleRequest;

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

export type PromiseOrValue<T> = T | Promise<T>;

export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? // eslint-disable-next-line no-use-before-define
    DeepPartialArray<U>
  : T extends object
  ? // eslint-disable-next-line no-use-before-define
    DeepPartialObject<T>
  : T | undefined;

interface DeepPartialArray<T> extends Array<PromiseOrValue<DeepPartial<PromiseOrValue<T>>>> {}
type DeepPartialObject<T> = {
  [P in keyof T]?: PromiseOrValue<DeepPartial<PromiseOrValue<T[P]>>>;
};

export interface ExecutionContext extends HelixExecutionContext {
  request: {
    body?: any;
    headers: IncomingHttpHeaders;
    method: string;
    query: any;
  };
}

export interface BuildContextArgs {
  req: IncomingMessage;
}

export interface EnvelopContext extends ExecutionContext {}

export interface EnvelopResolvers extends Record<string, any> {}

export type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

export type InferFunctionReturn<TFunction extends (...args: any) => any> = PromiseType<ReturnType<TFunction>>;

export type PickRequired<T, TKey extends keyof T> = T & Required<Pick<T, TKey>>;
