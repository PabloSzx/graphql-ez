import type { GraphQLError, ExecutionResult, DocumentNode, OperationDefinitionNode } from 'graphql';
import type { IncomingHttpHeaders } from 'http';

export interface ExecutionPatchResult<
  TData = {
    [key: string]: any;
  },
  TExtensions = {
    [key: string]: any;
  }
> {
  errors?: ReadonlyArray<GraphQLError>;
  data?: TData | null;
  path?: ReadonlyArray<string | number>;
  label?: string;
  hasNext: boolean;
  extensions?: TExtensions;
}

export interface Result<TContext, TRootValue> {
  context?: TContext;
  document?: DocumentNode;
  operation?: OperationDefinitionNode;
  rootValue?: TRootValue;
}

export interface MultipartResponse<TContext, TRootValue> extends Result<TContext, TRootValue> {
  type: 'MULTIPART_RESPONSE';
  subscribe: (onResult: (result: ExecutionPatchResult) => void) => Promise<void>;
  unsubscribe: () => void;
}
export interface Push<TContext, TRootValue> extends Result<TContext, TRootValue> {
  type: 'PUSH';
  subscribe: (onResult: (result: ExecutionResult) => void) => Promise<void>;
  unsubscribe: () => void;
}

export interface Request {
  body?: any;
  headers: IncomingHttpHeaders;
  method: string;
  query: any;
}
