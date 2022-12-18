# @graphql-ez/client

## 0.6.1

### Patch Changes

- Updated dependencies [d2128a8c]
  - @graphql-ez/utils@0.2.0

## 0.6.0

### Minor Changes

- af8b9804: Change from Undici Client instance to Undici Pool instance (improve concurrency, use "undiciOptions.connections" option to limit it)
- 58fb3284: Fix query variables types from typed document node
- 58fb3284: Remove unused "headers" option on graphql-ws and legacy ws subscribe

### Patch Changes

- 58fb3284: Remove console.error calls

## 0.5.0

### Minor Changes

- aa79d433: Update undici to v5

### Patch Changes

- 67a2b806: Update eventsource to v2 (ref: https://github.com/EventSource/eventsource/blob/HEAD/HISTORY.md#200)
- 885dbe06: Add error body text on `Unexpected content type` error
- d2e563ad: Allow customize/override undici request options

## 0.4.2

### Patch Changes

- 85a59b34: cache document print with WeakMap
- ec18e5a1: Allow give custom undici client options

## 0.4.1

### Patch Changes

- 6a80979f: Update undici

## 0.4.0

### Minor Changes

- 2fcfc849: Bundle and lazy import upload/websocket/stream dependencies

### Patch Changes

- 2fcfc849: Add basic documentation
- Updated dependencies [20315168]
  - @graphql-ez/utils@0.1.4

## 0.3.1

### Patch Changes

- acc0cae3: Fix node-fetch version

## 0.3.0

### Minor Changes

- 4cd305e4: Use ".json()" and ".text()" undici body mixins

### Patch Changes

- Updated dependencies [170e7b66]
  - @graphql-ez/utils@0.1.3

## 0.2.3

### Patch Changes

- a7537dc2: add new "assertedQuery" that returns data directly and rejects on error

## 0.2.2

### Patch Changes

- 2c3504e: Update dependencies

## 0.2.1

### Patch Changes

- cb57cb6: Update subscriptions-transport-ws-envelop

## 0.2.0

### Minor Changes

- 67bb1d7: add "uploadQuery" that accepts ReadStream or Buffer as file upload variables

### Patch Changes

- a610836: overall improvements
- Updated dependencies [9538fc4]
- Updated dependencies [ea95b4f]
  - @graphql-ez/utils@0.1.1

## 0.1.1

### Patch Changes

- Updated dependencies [272c4cc]
  - @graphql-ez/utils@0.1.0
