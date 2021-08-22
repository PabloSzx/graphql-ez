## `@graphql-ez/automatic-persisted-queries`

This plugin implements configurable Apollo style Automatic Persisted Queries, with compatibility for `apollo-client`.

https://www.apollographql.com/docs/apollo-server/performance/apq/

## Getting Started

```
yarn add @graphql-ez/automatic-persisted-queries
```

## Usage Example

```ts
import { ezAutomaticPersistedQueries } from '@graphql-ez/automatic-persisted-queries';

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

*Advanced usage only*

#### `disableIf(context: DisableContext): boolean`

Disable the plugin persisted queries per request based on context. 

#### Example
```ts
import { PersistedQueryStore } from '@graphql-ez/automatic-persisted-queries';
import IORedis from 'ioredis';

let isDisabled = false;

const redis = new IORedis();
redis.on("connect", () => {
  isDisabled = false;
});

redis.on("close", () => {
  isDisabled = true;
});

redis.on("error", () => {
  isDisabled = true;
});

export const store: PersistedQueryStore = {
  set: async (key, query) => {
    await redis.set(key, query)
  },
  get: async key => {
    const [err, val] = await redis.get(key);
    if (err) throw err;
    return val;
  },
};

const ezApp = CreateApp({
  ez: {
    plugins: [
      // ...
      ezAutomaticPersistedQueries({
        store,
        disbleIf: () => isDisabled
      }),
    ],
  },
  // ...
});

```


#### `store`

The store that maps query hashes to query documents. If unspecified, we provide an in-memory LRU cache capped
at `1000` elements with a ttl of an hour to prevent DoS attacks on the storage of hashes & queries.

The store interface is based on 2 simple functions, so you can connect to any key/value data store.

Here's an example of a naive, unbounded in-memory store:

```ts
import { PersistedQueryStore } from '@graphql-ez/automatic-persisted-queries';

// You can implement `data` in any custom way, and even fetch it from a remote store.
const data: Record<string, DocumentNode | string> = {};

export const myStore: PersistedQueryStore = {
  put: async (key, document) => (data[key] = document),
  get: async key => data[key],
};
```

You can use the utility function `createLRUStore` to create a cache for your own purposes.

```ts
import { PersistedQueryStore, createLRUStore } from '@graphql-ez/automatic-persisted-queries';

/** Create an LRU based store with a max of 100 items and a ttl of 1 minute */
const smallStore = createLRUStore(100, 60000);
```

> For DDOS protection, ensure that your store is capped to a reasonable size and if possible uses expiration policies.

#### `hashAlgorithm`

The algorithm used to hash query text. Possible values are `sha256`, `sha512`, `sha1`, `md5`.

Default `sha256`

#### `version`

The current protocol version. If set, the `version` field of the `persistedQuery` extension must match this value, otherwise
an error with message `PersistedQueryInvalidVersion` will be raised.

Default: `1`
