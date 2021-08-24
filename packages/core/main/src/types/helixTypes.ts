import type { IncomingHttpHeaders } from 'http';
import type { ProcessRequestOptions as HelixProcessRequestOptions } from '@pablosz/graphql-helix';
import type { EZContext, PickRequired } from '../index';
export interface Request {
  body?: any;
  headers: IncomingHttpHeaders;
  method: string;
  query: any;
}

export type ProcessRequestOptions = Pick<
  HelixProcessRequestOptions<EZContext, unknown>,
  'formatPayload' | 'rootValueFactory' | 'validationRules'
>;

export type PreProcessRequestOptions<Context = EZContext> = PickRequired<
  HelixProcessRequestOptions<Context, unknown>,
  'request' | 'schema' | 'parse' | 'validate' | 'contextFactory' | 'execute' | 'subscribe'
>;
