import crypto from 'crypto';
import type { Plugin } from '@envelop/types';
import { EnvelopError } from '@envelop/core';
import { createLRUStore, PersistedQueryStore } from './store';
import { getRequestBody } from './utils';
import type { BuildContextArgs, EZPlugin, HandleRequest, Request } from 'graphql-ez';
import { handleRequest } from 'graphql-ez';

const errors = {
  NOT_SUPPORTED: 'PersistedQueryNotSupported',
  NOT_FOUND: 'PersistedQueryNotFound',
  HASH_MISSING: 'PersistedQueryHashMissing',
  INVALID_VERSION: 'Unsupported persisted query version',
  HASH_MISMATCH: 'PersistedQueryHashMismatch',
};

const codes = {
  NOT_SUPPORTED: 'PERSISTED_QUERY_NOT_SUPPORTED',
  NOT_FOUND: 'PERSISTED_QUERY_NOT_FOUND',
  HASH_MISSING: 'PERSISTED_QUERY_HASH_MISSING',
  INVALID_VERSION: 'PERSISTED_QUERY_INVALID_VERSION',
  HASH_MISMATCH: 'PERSISTED_QUERY_HASH_MISMATCH',
};

declare module 'graphql-ez' {
  interface InternalAppBuildContext {
    automaticPersistedQueries?: AutomaticPersistedQueryOptions;
  }

  interface BuildContextArgs {
    apq?: APQContext;
  }

  interface EZContext {
    apq?: APQContext;
  }
}

export class PersistedQueryError extends EnvelopError {
}


const DEFAULT_PROTOCOL_VERSION = 1;
const PERSISTED_QUERY_EXTENSION_KEY = 'persistedQuery';

const ALGORITHMS = ['sha256', 'sha512', 'sha1', 'md5'] as const;

export type HashAlgorithm = typeof ALGORITHMS[number];

export interface PersistedQuery {
  query?: string;
  version: number;
  hash: string;
}

interface APQContext {
  isCached: boolean;
  query: string;
  hash: string;
}

export interface AutomaticPersistedQueryOptions {
  /**
   * The query hash algorithm
   */
  hashAlgorithm?: HashAlgorithm;
  /**
   * The protocol version
   */
  version?: number;
  /**
   *  Retrieve the persisted query data from a request.
   */
  resolvePersistedQuery?: (request: Readonly<Request>) => PersistedQuery | undefined;
  /**
   *  Storage for persisted queries.
   */
  store?: PersistedQueryStore;
}

export const DEFAULT_HASH_ALGORITHM: HashAlgorithm = 'sha256';

export function generateHash(query: string, algo: HashAlgorithm): string {
  return crypto.createHash(algo).update(query, 'utf8').digest('hex');
}

export function parseRequestBody(body: any, hashField: string): PersistedQuery | undefined {
  if (body) {
    const query = body?.query;
    const pq = body?.extensions?.[PERSISTED_QUERY_EXTENSION_KEY];
    if (pq) {
      const { version } = pq;
      if (typeof version !== 'number' && !pq[hashField]) {
        throw new PersistedQueryError(errors.NOT_FOUND, { code: codes.NOT_FOUND });
      }
      const hash = pq[hashField];
      return { query, hash, version };
    }
  }
  return undefined;
}

function getPersistedQueryFromContext(req: Readonly<Request>, algorithm: HashAlgorithm): PersistedQuery | undefined {
  const body = getRequestBody(req);
  const key = `${algorithm as string}Hash`;
  return parseRequestBody(body, key);
}

export const ezAutomaticPersistedQueries = (options?: AutomaticPersistedQueryOptions): EZPlugin => {
  // Load the persisted query settings
  const {
    store: _store,
    version: expectedVersion = DEFAULT_PROTOCOL_VERSION,
    resolvePersistedQuery: _resolvePersistedQuery,
    hashAlgorithm = DEFAULT_HASH_ALGORITHM,
  } = {
    ...(options || {}),
  };
  const store = _store ?? createLRUStore();
  const getPersistedQuery = _resolvePersistedQuery ?? (request => getPersistedQueryFromContext(request, hashAlgorithm));

  function parsePersistedQuery(request: Request): APQContext | undefined {
    const persistedQuery = getPersistedQuery(request);
    let query = persistedQuery?.query;

    let isCached = false;

    if (persistedQuery) {
      // This is a persisted query, so we use the hash in the request
      // to load the full query document.
      const { hash, version } = persistedQuery;

      if (version !== expectedVersion) {
        throw new PersistedQueryError(errors.INVALID_VERSION, { code: codes.INVALID_VERSION });
      }

      if (!hash) {
        throw new PersistedQueryError(errors.HASH_MISSING, { code: codes.HASH_MISSING });
      }

      if (query === undefined) {

        const cachedQuery = store.get(hash);
        if (!cachedQuery) {
          // Query has not been found, tell the client.
          throw new PersistedQueryError(errors.NOT_FOUND, { code: codes.NOT_FOUND });
        }

        query = cachedQuery;
        isCached = true;

      } else {
        const computedQueryHash = generateHash(query, hashAlgorithm);

        // The provided hash must exactly match the hash of
        // the query string. This prevents hash hijacking, where a
        // new and potentially malicious query is associated with
        // an existing hash.
        if (hash !== computedQueryHash) {
          throw new PersistedQueryError(`Provided ${hashAlgorithm} hash does not match query`, { code: codes.HASH_MISMATCH });
        }

        isCached = false;
      }

      return { hash, query, isCached };
    }

    return undefined;
  }

  let savedRequestHandler: HandleRequest;

  const wrappedHandleRequest: HandleRequest = async (opts) => {
    let { request } = opts;
    const apq = parsePersistedQuery(request);
    if (apq && request.body !== apq.query) {
      const { req, contextArgs: _contextArgs } = opts;
      const contextArgs = (): BuildContextArgs => {
        if (_contextArgs) {
          return Object.assign({}, _contextArgs(), { apq, req } );
        }
        return { apq, req };
      };
      request = {
        body: {
          query: apq.query
        },
        ...request
      };
      opts = { ...opts, request, contextArgs };
      return savedRequestHandler(opts);
    }
    return savedRequestHandler(opts);
  };

  return {
    name: 'Automatic Persisted Queries',
    onRegister(ctx) {
      ctx.automaticPersistedQueries = options;
      savedRequestHandler = ctx.options.customHandleRequest || handleRequest;
      ctx.options.customHandleRequest = wrappedHandleRequest;
      ctx.options.envelop = ctx.options.envelop || [];
      ctx.options.envelop.plugins.push(
        useAutomaticPersistedQueriesEnvelopPlugin(store)
      );
    }
  };
};


function useAutomaticPersistedQueriesEnvelopPlugin(store: PersistedQueryStore): Plugin<{ apq?: APQContext}> {
  return {
    onParse({ context}) {
      const apq = context.apq;
      if (apq && !apq.isCached) {
        return ({ result }) => {
          if (!result || result instanceof Error) return;
          // save queries which are not yet persisted.
          store.put(apq.hash, apq.query);
        };
      }
      return;
    },
  };
}
