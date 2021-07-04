import type { MultipartResponse, Push } from 'graphql-helix';
import type { Request, ProcessRequestOptions } from './helixTypes';
import type { Envelop } from '@envelop/types';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ExecutionResult } from 'graphql';
import type { AppOptions, BuildContextArgs } from '../index';

export type EZResponse = {
  type: 'RESPONSE';
  status: number;
  payload: ExecutionResult | ExecutionResult[];
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
  getEnveloped: Envelop;

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
}

export type HandleRequest = <TReturn = unknown>(options: HandleRequestOptions<BuildContextArgs, TReturn>) => Promise<TReturn>;

export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;
