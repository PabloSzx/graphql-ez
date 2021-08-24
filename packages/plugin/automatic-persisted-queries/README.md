## @graphql-ez/plugin-automatic-persisted-queries

This plugin implements configurable Apollo style Automatic Persisted Queries, with compatibility for `apollo-client`.

https://www.apollographql.com/docs/apollo-server/performance/apq/

## Usage

```ts
import { ezAutomaticPersistedQueries } from '@graphql-ez/plugin-automatic-persisted-queries';

const ezApp = CreateApp({
  ez: {
    plugins: [
      // ...
      ezAutomaticPersistedQueries({
        // options
      }),
    ],
  },
  // ...
});
```

We provide reasonable defaults for all options, and the implementation is compatible with `apollo-client` without
additional configuration.

### Options

```ts
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
  resolvePersistedQuery?: (opts: Readonly<ProcessRequestOptions>) => PersistedQuery | undefined;
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
```

#### `resolvePersistedQuery(opts: ReadOnly<ProcessRequestOptions>): PersistedQuery | undefined`

If you wish to customize the extension extraction from your HTTP request, override this function. If `resolvePersistedQuery`
is not set, the default behavior is to look for the`persistedQuery` extension in the request `body`.

_Advanced usage only_

#### `disableIf(context: DisableContext): boolean`

Disable the plugin per request based on context. If this function returns `true`, the client should switch to making
normal non-persistent calls, per protocol.

#### Example

```ts
// Disable if we have issues connecting to the backend store.
import { PersistedQueryStore, ezAutomaticPersistedQueries } from '@graphql-ez/plugin-automatic-persisted-queries';
import IORedis from 'ioredis';

const HASH_KEY = 'apq-store';
const redis = new IORedis();

let isDisabled = true;

redis.on('connect', () => {
  isDisabled = false;
});

redis.on('close', () => {
  isDisabled = true;
});

redis.on('error', () => {
  isDisabled = true;
});

export const store: PersistedQueryStore = {
  set: async (key, query) => {
    await redis.hset(HASH_KEY, key, query);
  },
  get: async key => {
    const [err, val] = await redis.hget(HASH_KEY, key);
    if (err) throw err;
    return val;
  },
  clear: async () => {
    await redis.del(HASH_KEY);
  },
};

const ezApp = CreateApp({
  ez: {
    plugins: [
      // ...
      ezAutomaticPersistedQueries({
        store,
        disbleIf: () => isDisabled,
      }),
    ],
  },
  // ...
});
```

#### `store`

The store that maps query hashes to query documents. If unspecified, we provide an in-memory LRU cache capped
at `1000` elements with a ttl of an hour to prevent DoS attacks on the storage of hashes & queries.

Here's an example of a naive, unbounded in-memory store:

```ts
import { PersistedQueryStore } from '@graphql-ez/plugin-automatic-persisted-queries';

// You can implement `data` in any custom way, and even fetch it from a remote store.
const data = new Map<string, string>();

export const myStore: PersistedQueryStore = {
  put: async (key, query) => {
    data.set(key, query);
  },
  get: async key => data.get(key),
  clear: () => {
    data.clear();
  },
};
```

You can use the utility function `createLRUStore` to create a cache for your own purposes.

```ts
import { PersistedQueryStore, createLRUStore } from '@graphql-ez/plugin-automatic-persisted-queries';

/** Create an LRU based store with a max of 100 items and a ttl of 1 minute */
const smallStore = createLRUStore(100, 60000);
```

> For DDOS protection, ensure that your store is capped to a reasonable size and if possible uses expiration policies.

#### `hashAlgorithm`

The algorithm used to hash query text. Possible values are `sha256`, `sha512`, `sha1`, `md5`.

Default `sha256`

#### `version`

The current protocol version. The `version` field of the `persistedQuery` extension must match this value, otherwise
an error with message `PersistedQueryInvalidVersion` will be raised.

Default: `1`
