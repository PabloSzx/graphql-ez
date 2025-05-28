# @graphql-ez/plugin-websockets

## 0.12.0

### Minor Changes

- 473d6db: Update graphql-ws to ^6.0.5

### Patch Changes

- graphql-ez@0.16.1

## 0.11.3

### Patch Changes

- 933522a: Update package.json with export types field
- Updated dependencies [933522a]
  - graphql-ez@0.16.1
  - @graphql-ez/utils@0.2.1

## 0.11.2

### Patch Changes

- 36e7c9eb: allow introspecting onSubscribe from app level

## 0.11.1

### Patch Changes

- 6c9930bf: allow passing ws server as option

## 0.11.0

### Minor Changes

- d2128a8c: Update to Envelop v3, no code changes should be required for basic usage

### Patch Changes

- Updated dependencies [d2128a8c]
  - graphql-ez@0.16.0
  - @graphql-ez/utils@0.2.0

## 0.10.5

### Patch Changes

- Updated dependencies [dc502d9d]
  - graphql-ez@0.15.0

## 0.10.4

### Patch Changes

- 6a80979f: Update graphql-ws
- Updated dependencies [6a80979f]
  - graphql-ez@0.14.1

## 0.10.3

### Patch Changes

- Updated dependencies [8fa923b6]
  - graphql-ez@0.14.0

## 0.10.2

### Patch Changes

- 889f2c21: Fix: remove dynamic imports due to jest/v8 bug, change interop method for specific problematic dependencies

  See:

  - https://bugs.chromium.org/p/v8/issues/detail?id=10284
  - https://github.com/nodejs/node/issues/36351
  - https://github.com/facebook/jest/issues/11438

## 0.10.1

### Patch Changes

- 697dba67: Fix CJS/ESM Interop

## 0.10.0

### Minor Changes

- e99511d: Change "compatibilityList" signature
- e99511d: Refactor onIntegrationRegister logic

### Patch Changes

- Updated dependencies [e99511d]
- Updated dependencies [e99511d]
- Updated dependencies [e99511d]
  - graphql-ez@0.13.0

## 0.9.3

### Patch Changes

- 2d23436: include context args in EZContext itself
- Updated dependencies [2d23436]
- Updated dependencies [7828f5e]
  - graphql-ez@0.12.6

## 0.9.2

### Patch Changes

- 04e90c1: add `"sideEffects": false` for tree-shaking
- Updated dependencies [04e90c1]
  - graphql-ez@0.12.5
  - @graphql-ez/utils@0.1.2

## 0.9.1

### Patch Changes

- cb57cb6: Update subscriptions-transport-ws-envelop
  - graphql-ez@0.12.4

## 0.9.0

### Minor Changes

- 1e0e5ce: update "ws" to v8 (with outdated types until @types/ws is updated)

### Patch Changes

- Updated dependencies [ebd1306]
- Updated dependencies [4c3ed73]
- Updated dependencies [9538fc4]
- Updated dependencies [ea95b4f]
- Updated dependencies [3963abb]
  - graphql-ez@0.12.1
  - @graphql-ez/utils@0.1.1

## 0.8.0

### Minor Changes

- 272c4cc: separate @graphql-ez/utils package

### Patch Changes

- Updated dependencies [272c4cc]
- Updated dependencies [655cea4]
- Updated dependencies [b0c307a]
- Updated dependencies [655cea4]
  - graphql-ez@0.12.0
  - @graphql-ez/utils@0.1.0

## 0.7.0

### Minor Changes

- 8672feb: automatically fill graphiql & altair sub providers

### Patch Changes

- Updated dependencies [8106a74]
  - graphql-ez@0.11.0

## 0.6.1

### Patch Changes

- Updated dependencies [b1c27d1]
- Updated dependencies [faff0ad]
  - graphql-ez@0.10.0

## 0.6.0

### Minor Changes

- 0d8cf81: update Envelop to v1.0

### Patch Changes

- Updated dependencies [0731fc3]
- Updated dependencies [0d8cf81]
  - graphql-ez@0.9.0

## 0.5.0

### Minor Changes

- 9d5b497: Update Envelop

### Patch Changes

- Updated dependencies [9d5b497]
  - graphql-ez@0.8.0

## 0.4.2

### Patch Changes

- Updated dependencies [75683b8]
  - graphql-ez@0.7.0

## 0.4.1

### Patch Changes

- Updated dependencies [b2dd453]
- Updated dependencies [0f4c31b]
  - graphql-ez@0.6.0

## 0.4.0

### Minor Changes

- 1fb2078: always add "req" IncomingMessage to context

### Patch Changes

- Updated dependencies [1a91791]
- Updated dependencies [1fb2078]
  - graphql-ez@0.5.0

## 0.3.0

### Minor Changes

- 83b5c31: move augmented interfaces to graphql-ez index

### Patch Changes

- Updated dependencies [83b5c31]
  - graphql-ez@0.4.0

## 0.2.0

### Minor Changes

- 74b7f2b: restructure all core packages into graphql-ez and move into peerDependencies (now it's required to manually install graphql-ez in projects)

## 0.1.3

### Patch Changes

- d2d11b2: reference https://www.graphql-ez.com website
- 89e875c: add support for presets
- Updated dependencies [d2d11b2]
- Updated dependencies [89e875c]
  - @graphql-ez/core-types@0.2.4
  - @graphql-ez/core-utils@0.2.2

## 0.1.2

### Patch Changes

- 8c8389a: improve vanilla EZResolvers using graphql-tools types
- 6f05eab: set required Node.js engines
- Updated dependencies [8c8389a]
- Updated dependencies [6f05eab]
  - @graphql-ez/core-types@0.2.3
  - @graphql-ez/core-utils@0.2.1

## 0.1.1

### Patch Changes

- 0d71f33: re-export Envelop from core
- Updated dependencies [0d71f33]
- Updated dependencies [9a7038b]
  - @graphql-ez/core-types@0.2.2

## 0.1.0

### Minor Changes

- 28ca48d: [BREAKING CHANGE] Plugin based complete restructure - Please check https://github.com/PabloSzx/graphql-ez/tree/main/examples

### Patch Changes

- Updated dependencies [28ca48d]
  - @graphql-ez/core-types@0.2.0
  - @graphql-ez/core-utils@0.2.0
