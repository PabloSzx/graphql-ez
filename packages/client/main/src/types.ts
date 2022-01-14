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
    unsubscribe: () => Promise<void>;
    iterator: AsyncGenerator<ExecutionResult<TResult>, void>;
  };
}
