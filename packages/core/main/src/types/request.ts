import type { GetEnvelopedFn, PromiseOrValue } from '@envelop/types';
import type { MultipartResponse, ProcessRequestResult, Push } from '@pablosz/graphql-helix';
import type { ExecutionResult } from 'graphql';
import type { IncomingMessage, ServerResponse } from 'http';
import type { AppOptions, BuildContextArgs, EZContext } from '../index';
import type { ProcessRequestOptions, Request, PreProcessRequestOptions } from './helixTypes';

export type EZResponse = {
  type: 'RESPONSE';
  status: number;
  payload: ExecutionResult | ExecutionResult[];
  headers: { name: string; value: string }[];
};

export type DefaultResponseHandler = (req: IncomingMessage, res: ServerResponse, result: EZResponse) => void | Promise<void>;

export type DefaultMultipartResponseHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  result: MultipartResponse<unknown, unknown>
) => void | Promise<void>;

export type DefaultPushResponseHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  result: Push<unknown, unknown>
) => void | Promise<void>;

export interface HandleRequestOptions<BuildContextArgs, TReturn = unknown> {
  request: Request;
  getEnveloped: GetEnvelopedFn<unknown>;

  req: IncomingMessage;

  baseOptions: AppOptions;

  contextArgs: () => BuildContextArgs;
  buildContext: ((args: BuildContextArgs) => Record<string, unknown> | Promise<Record<string, unknown>>) | undefined;

  onResponse: (result: EZResponse, defaultHandle: DefaultResponseHandler) => TReturn | Promise<TReturn>;
  onMultiPartResponse: (
    result: MultipartResponse<unknown, unknown>,
    defaultHandle: DefaultMultipartResponseHandler
  ) => TReturn | Promise<TReturn>;
  onPushResponse: (result: Push<unknown, unknown>, defaultHandle: DefaultPushResponseHandler) => TReturn | Promise<TReturn>;

  processRequestOptions: (() => ProcessRequestOptions) | undefined;

  preProcessRequest: PreProcessRequest[] | undefined;
}

export type HandleRequest = <TReturn = unknown>(options: HandleRequestOptions<BuildContextArgs, TReturn>) => Promise<TReturn>;

export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;

/**
 * Callback called sequentially before the default request process.
 *
 * You can safely mutate `requestOptions` argument
 *
 * If it returns an object, it interrupts the default execution returning the given payload.
 */
export interface PreProcessRequest {
  (
    data: Readonly<{ appOptions: AppOptions; requestOptions: PreProcessRequestOptions }>
  ): PromiseOrValue<ProcessRequestResult<EZContext, unknown> | undefined | null | void>;
}
