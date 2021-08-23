import type { ExecutionResult } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { IncomingHttpHeaders } from 'http';

export type SubscribeOptions<
  TResult,
  TVariables extends Record<string, unknown>,
  TExtensions extends Record<string, unknown> = Record<string, unknown>,
  TExtra extends {} = {}
> = {
  onData?: (data: ExecutionResult<TResult>) => void;
  variables?: TVariables;
  operationName?: string;
  extensions?: TExtensions | null;
  headers?: IncomingHttpHeaders;
} & Partial<TExtra>;

export interface SubscribeFunction<TExtra extends Record<string, any> = {}> {
  <
    TResult = unknown,
    TVariables extends Record<string, unknown> = {
      [key: string]: any;
    },
    TExtensions extends Record<string, unknown> = Record<string, unknown>
  >(
    query: string | TypedDocumentNode<TResult, TVariables>,
    options?: SubscribeOptions<TResult, TVariables, TExtensions, TExtra>
  ): {
    done: Promise<void>;
    unsubscribe: () => void;
    iterator: AsyncGenerator<ExecutionResult<TResult>, void>;
  };
}

/**
 * Due to how the SSE Client works, it's not possible to set the headers on a per-subscription basic,
 * and you have to use the initial headers or change the headers using "setHeaders"
 */
export type SubscribeOptionsWithoutHeaders<
  TResult,
  TVariables extends Record<string, unknown>,
  TExtensions extends Record<string, unknown> = Record<string, unknown>,
  TExtra extends {} = {}
> = {
  onData?: (data: ExecutionResult<TResult>) => void;
  variables?: TVariables;
  operationName?: string;
  extensions?: TExtensions | null;
} & Partial<TExtra>;

export interface SubscribeFunctionWithoutHeaders<TExtra extends Record<string, any> = {}> {
  <
    TResult = unknown,
    TVariables extends Record<string, unknown> = {
      [key: string]: any;
    },
    TExtensions extends Record<string, unknown> = Record<string, unknown>
  >(
    query: string | TypedDocumentNode<TResult, TVariables>,
    options?: SubscribeOptionsWithoutHeaders<TResult, TVariables, TExtensions, TExtra>
  ): {
    done: Promise<void>;
    unsubscribe: () => void;
    iterator: AsyncGenerator<ExecutionResult<TResult>, void>;
  };
}
