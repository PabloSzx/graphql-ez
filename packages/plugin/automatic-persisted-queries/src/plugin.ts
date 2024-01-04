import { isDocumentNode } from '@graphql-ez/utils/document';
import crypto from 'crypto';
import { GraphQLError } from 'graphql';
import type { EZPlugin, PreProcessRequest, PreProcessRequestOptions } from 'graphql-ez';
import {
  createErrorResponse,
  PersistedQueryInvalidVersionError,
  PersistedQueryNotFoundError,
  PersistedQueryNotSupportedError,
} from './errors';
import { createLRUStore, PersistedQueryStore } from './store';

export interface PersistedQuery {
  version: number;
  hash: string;
}

export type DisableContext = Pick<
  PreProcessRequestOptions,
  'request' | 'extensions' | 'query' | 'operationName' | 'variables'
> & { persistedQuery: PersistedQuery };

declare module 'graphql-ez' {
  interface InternalAppBuildContext {
    automaticPersistedQueries?: AutomaticPersistedQueryOptions;
  }
}

const DEFAULT_PROTOCOL_VERSION = 1;
const PERSISTED_QUERY_EXTENSION_KEY = 'persistedQuery';

const ALGORITHMS = ['sha256', 'sha512', 'sha1', 'md5'] as const;

export type HashAlgorithm = (typeof ALGORITHMS)[number];

export const DEFAULT_HASH_ALGORITHM: HashAlgorithm = 'sha256';

export interface AutomaticPersistedQueryOptions {
  /**
   * The query hash algorithm
   *
   * @default "sha256"
   */
  hashAlgorithm?: HashAlgorithm;
  /**
   * The protocol version
   *
   * @default 1
   */
  version?: number;
  /**
   *  Retrieve the persisted query data from a request.
   */
  resolvePersistedQuery?: (options: Readonly<PreProcessRequestOptions>) => PersistedQuery | undefined;
  /**
   * Specify whether the persisted queries should be disabled for the current request. By default all requests
   * following the APQ protocol are accepted. If false is returned, a PersistedQueryNotSupportedError is
   * sent to the client.
   */
  disableIf?: (context: DisableContext) => boolean;
  /**
   *  Storage for persisted queries.
   */
  store?: PersistedQueryStore;
}

export function generateHash(query: string, algo: HashAlgorithm): string {
  return crypto.createHash(algo).update(query, 'utf8').digest('hex');
}

function getPersistedQueryFromContext(
  opts: Readonly<PreProcessRequestOptions>,
  algorithm: HashAlgorithm
): PersistedQuery | undefined {
  const hashField = `${algorithm}Hash`;

  const extensions = opts.extensions
    ? typeof opts.extensions === 'string'
      ? JSON.parse(opts.extensions)
      : opts.extensions
    : undefined;
  const pq = extensions?.[PERSISTED_QUERY_EXTENSION_KEY];
  if (pq) {
    const { version } = pq;
    const hash = String(pq[hashField]);
    return { hash, version: parseInt(version) };
  }
  return undefined;
}

export const ezAutomaticPersistedQueries = (options?: AutomaticPersistedQueryOptions): EZPlugin => {
  // Load the persisted query settings
  const {
    store: _store,
    version: expectedVersion = DEFAULT_PROTOCOL_VERSION,
    resolvePersistedQuery: _resolvePersistedQuery,
    hashAlgorithm = DEFAULT_HASH_ALGORITHM,
    disableIf,
  } = {
    ...(options || {}),
  };
  const store = _store || createLRUStore();
  const getPersistedQuery = _resolvePersistedQuery || (opts => getPersistedQueryFromContext(opts, hashAlgorithm));

  const processRequest: PreProcessRequest = async function processRequest({ requestOptions: options }) {
    const { query, extensions } = options;
    let persistedQuery: PersistedQuery | undefined;

    if (isDocumentNode(query)) return;

    try {
      persistedQuery = getPersistedQuery(options);
    } catch (e: unknown) {
      if (e instanceof PersistedQueryNotFoundError) {
        return createErrorResponse(e);
      }
      throw e;
    }

    if (persistedQuery) {
      // This is a persisted query, so we use the hash in the request
      // to load the full query document.
      const { hash, version } = persistedQuery;

      if (!hash || !Number.isInteger(version)) {
        return createErrorResponse(new PersistedQueryNotFoundError(extensions));
      }

      if (version !== expectedVersion) {
        return createErrorResponse(new PersistedQueryInvalidVersionError(extensions));
      }

      if (disableIf) {
        const { query, operationName, request, variables } = options;
        const context: DisableContext = {
          extensions,
          operationName,
          query,
          request,
          variables,
          persistedQuery,
        };
        if (disableIf(context)) {
          return createErrorResponse(new PersistedQueryNotSupportedError(extensions));
        }
      }

      if (query === undefined) {
        const cached = await store.get(hash);
        if (!cached) {
          // Query has not been found, tell the client.
          return createErrorResponse(new PersistedQueryNotFoundError(extensions));
        }

        options.query = cached;
      } else {
        const { validate } = options;

        const computedQueryHash = generateHash(query, hashAlgorithm);

        // The provided hash must exactly match the hash of
        // the query string. This prevents hash hijacking, where a
        // new and potentially malicious query is associated with
        // an existing hash.
        if (hash !== computedQueryHash) {
          return createErrorResponse(new GraphQLError(`Provided ${hashAlgorithm} hash does not match query`));
        }

        options.query = query;

        // store query if it's valid
        options.validate = (...args) => {
          const errors: readonly GraphQLError[] | null = validate(...args);

          if (!errors?.length) {
            try {
              Promise.resolve(store.set(hash, query)).catch(console.error);
            } catch (err) {
              console.error(err);
            }
          }

          return errors;
        };
      }
    }

    return;
  };

  return {
    name: 'Automatic Persisted Queries',
    onRegister(ctx) {
      ctx.automaticPersistedQueries = options;
      (ctx.preProcessRequest ||= []).push(processRequest);
    },
    onPreBuild(ctx) {
      const {
        envelop: { plugins },
      } = ctx.options;

      plugins.push({
        onSchemaChange() {
          // unfortunately onSchemaChange is not async
          try {
            Promise.resolve(store.clear()).catch(console.error);
          } catch (err) {
            console.error(err);
          }
        },
      });
    },
  };
};
