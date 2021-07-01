import type { IncomingHttpHeaders } from 'http';
import type { ProcessRequestOptions as HelixProcessRequestOptions } from 'graphql-helix';
import type { EZContext } from '../index';

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
