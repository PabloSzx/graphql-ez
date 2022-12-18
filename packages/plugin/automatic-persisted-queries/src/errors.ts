import { GraphQLError, versionInfo } from 'graphql';

import type { EZContext } from 'graphql-ez';
import type { Response } from '@pablosz/graphql-helix';

function isObject(candidate: unknown): candidate is object {
  return typeof candidate === 'object' && !Array.isArray(candidate);
}

function parseExtensions(
  extensions: string | Record<string, unknown> | undefined,
  code = 'INTERNAL_SERVER_ERROR'
): Record<string, unknown> {
  let res: Record<string, unknown>;

  if (!isObject(extensions)) {
    if (!extensions) {
      res = Object.create(null);
    } else {
      extensions = JSON.parse(extensions);
      if (!isObject(extensions)) {
        res = {};
      } else {
        res = extensions;
      }
    }
  } else {
    res = extensions;
  }
  if (!res['code']) res['code'] = code;
  return res;
}

type GraphQLErrorParameters = ConstructorParameters<typeof GraphQLError>;

type TupleSplit<T, N extends number, O extends readonly any[] = readonly []> = O['length'] extends N
  ? [O, T]
  : T extends readonly [infer F, ...infer R]
  ? TupleSplit<readonly [...R], N, readonly [...O, F]>
  : [O, T];

type SkipFirst<T extends readonly any[], N extends number> = TupleSplit<T, N>[1];

export class PersistedQueryError extends GraphQLError {
  constructor(message: string, extensions?: string | Record<string, unknown>) {
    const parsedExtensions = parseExtensions(extensions);

    const oldParams: SkipFirst<GraphQLErrorParameters, 1> = [
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      parsedExtensions,
    ];

    const newParams: SkipFirst<GraphQLErrorParameters, 1> = [
      { extensions: parsedExtensions } as unknown as GraphQLErrorParameters[1],
    ];

    super(message, ...(versionInfo.major >= 17 ? newParams : oldParams));
  }
}

export async function createErrorResponse(error: GraphQLError): Promise<Response<EZContext, unknown>> {
  const errors = [error];

  const response: Response<EZContext, unknown> = {
    headers: [],
    payload: {
      errors,
    },
    rootValue: undefined,
    status: 400,
    type: 'RESPONSE',
  };

  // Persisted query errors (especially "not found") need to be uncached,
  // because hopefully we're about to fill in the APQ cache and the same
  // request will succeed next time. We also want a 200 response to avoid any
  // error handling that may mask the contents of an error response.
  if (errors.every(err => err instanceof PersistedQueryNotSupportedError || err instanceof PersistedQueryNotFoundError)) {
    response.status = 200;
    response.headers = [{ name: 'Cache-Control', value: 'private, no-cache, must-revalidate' }];
  }

  return response;
}

export class PersistedQueryNotFoundError extends PersistedQueryError {
  constructor(extensions?: string | Record<string, unknown>) {
    super('PersistedQueryNotFound', parseExtensions(extensions, 'PERSISTED_QUERY_NOT_FOUND'));
  }
}

export class PersistedQueryNotSupportedError extends PersistedQueryError {
  constructor(extensions?: string | Record<string, unknown>) {
    super('PersistedQueryNotSupported', parseExtensions(extensions, 'PERSISTED_QUERY_NOT_SUPPORTED'));
  }
}

export class PersistedQueryInvalidVersionError extends PersistedQueryError {
  constructor(extensions?: string | Record<string, unknown>) {
    super('Unsupported persisted query version', parseExtensions(extensions, 'PERSISTED_QUERY_INVALID_VERSION'));
  }
}
