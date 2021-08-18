import type { ExecutionResult } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

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
} & Partial<TExtra>;

export interface SubscribeFunction {
  <
    TResult = unknown,
    TVariables extends Record<string, unknown> = {
      [key: string]: any;
    },
    TExtensions extends Record<string, unknown> = Record<string, unknown>,
    TExtra extends Record<string, unknown> = {}
  >(
    query: string | TypedDocumentNode<TResult, TVariables>,
    options?: SubscribeOptions<TResult, TVariables, TExtensions, TExtra>
  ): {
    done: Promise<void>;
    unsubscribe: () => void;
    iterator: AsyncGenerator<ExecutionResult<TResult>, void>;
  };
}
