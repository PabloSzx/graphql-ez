import { lru } from 'tiny-lru';
import type { PromiseOrValue } from 'graphql-ez';

export interface PersistedQueryStore {
  /**
   * Transforms a hash/id into a SDL string.
   * Return `null` in case of a store miss.
   * @param hash
   */
  get(hash: string): PromiseOrValue<string | null>;

  /**
   *  Save a query, given its hash.
   */
  set: (hash: string, query: string) => PromiseOrValue<void>;
  /*
   * Drops all data from the cache.
   */
  clear: () => PromiseOrValue<void>;
}

const DEFAULT_MAX = 1000;
const DEFAULT_TTL = 3600000;

export const createLRUStore = (maxSize?: number, ttl?: number): PersistedQueryStore => {
  maxSize = maxSize ?? DEFAULT_MAX;
  ttl = ttl ?? DEFAULT_TTL;

  // Initialize a LRU cache in the local scope.
  // LRU is used to prevent DoS attacks.
  const cache = lru<string>(maxSize, ttl);
  return {
    async get(hash: string) {
      return cache.get(hash) ?? null;
    },
    async set(hash: string, query: string) {
      cache.set(hash, query);
    },
    clear(): PromiseOrValue<void> {
      cache.clear();
    },
  };
};
