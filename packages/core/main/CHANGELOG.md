# graphql-ez

## 0.13.5

### Patch Changes

- 27970292: Bump Envelop
- Updated dependencies [13cb6398]
  - @pablosz/graphql-helix@2.0.3

## 0.13.4

### Patch Changes

- 012d019e: Bump Envelop

## 0.13.3

### Patch Changes

- 0bc0dc8f: Bump Envelop

## 0.13.2

### Patch Changes

- 99bab957: allow nullable Envelop plugins for conditional filtering

## 0.13.1

### Patch Changes

- 92256f37: Implement InMemoryPubSub & StrictInMemoryPubSub (with full type-safety), available via "graphql-ez/pubsub"

## 0.13.0

### Minor Changes

- e99511d: Change "compatibilityList" signature
- e99511d: Refactor onIntegrationRegister logic

### Patch Changes

- e99511d: fix: pass "enableInternalTracing" to Envelop

## 0.12.7

### Patch Changes

- cc0c9eb: Improve cache & introspection logic with custom plugins

## 0.12.6

### Patch Changes

- 2d23436: include context args in EZContext itself
- 7828f5e: fix detect share graphiql url

## 0.12.5

### Patch Changes

- 04e90c1: add `"sideEffects": false` for tree-shaking
- Updated dependencies [04e90c1]
  - @graphql-ez/utils@0.1.2

## 0.12.4

### Patch Changes

- Updated dependencies [01a6358]
  - @pablosz/graphql-helix@2.0.0

## 0.12.3

### Patch Changes

- 0a20573: Set custom headers on default response

## 0.12.2

### Patch Changes

- 9878698: access InternalAppBuildContext with symbol
- 2027671: improve PreProcessRequest options

## 0.12.1

### Patch Changes

- ebd1306: Restrict more than a single "buildApp" call
- 4c3ed73: add "preProcessRequest"
- 3963abb: asPreset returns copy of objects
- Updated dependencies [4c3ed73]
- Updated dependencies [9538fc4]
- Updated dependencies [ea95b4f]
  - @pablosz/graphql-helix@1.7.2
  - @graphql-ez/utils@0.1.1

## 0.12.0

### Minor Changes

- 272c4cc: separate @graphql-ez/utils package
- 655cea4: freeze app builder ezPlugins

### Patch Changes

- b0c307a: improve deferred promise preventing unhandled rejection
- 655cea4: NullableEZPlugin type & allow Envelop plugin promise
- Updated dependencies [272c4cc]
  - @graphql-ez/utils@0.1.0

## 0.11.0

### Minor Changes

- 8106a74: Use local version of graphql-helix @pablosz/graphql-helix

### Patch Changes

- Updated dependencies [8106a74]
  - @pablosz/graphql-helix@1.7.1

## 0.10.0

### Minor Changes

- b1c27d1: allow nullish or boolean in EZ Plugin list (which are filtered out in build)

### Patch Changes

- faff0ad: update envelop

## 0.9.2

### Patch Changes

- 860d050: update envelop

## 0.9.1

### Patch Changes

- e74e5a2: update graphql-helix

## 0.9.0

### Minor Changes

- 0d8cf81: update Envelop to v1.0

### Patch Changes

- 0731fc3: allow "'dynamic'" options.schema for dynamic schema usage

## 0.8.1

### Patch Changes

- f2ce9f1: update Envelop version
- 0d4a24d: assign preset options to main app options

## 0.8.0

### Minor Changes

- 9d5b497: Update Envelop

## 0.7.0

### Minor Changes

- 75683b8: minize core graphql-ez schema logic, release @graphql-ez/plugin-schema with the removed features

## 0.6.0

### Minor Changes

- b2dd453: rename internal handle request option "buildContextArgs" to "contextArgs"

### Patch Changes

- 0f4c31b: add Envelop "enableInternalTracing" option

## 0.5.0

### Minor Changes

- 1fb2078: always add "req" IncomingMessage to context

### Patch Changes

- 1a91791: add disable instropection configuration

## 0.4.1

### Patch Changes

- df3415c: add "envelopPlugins" and "ezPlugins" in app builder
- 23c0287: allow customize helix processRequest options

## 0.4.0

### Minor Changes

- 83b5c31: move augmented interfaces to graphql-ez index

## 0.3.1

### Patch Changes

- 8a4dc83: allow no explicit schema
- ea3dd48: get EZ App back as preset

## 0.2.4

### Patch Changes

- d2d11b2: reference https://www.graphql-ez.com website
- 89e875c: add support for presets
- Updated dependencies [d2d11b2]
- Updated dependencies [89e875c]
  - @graphql-ez/core-types@0.2.4
  - @graphql-ez/core-utils@0.2.2

## 0.2.3

### Patch Changes

- 8c8389a: improve vanilla EZResolvers using graphql-tools types
- 6f05eab: set required Node.js engines
- Updated dependencies [8c8389a]
- Updated dependencies [6f05eab]
  - @graphql-ez/core-types@0.2.3
  - @graphql-ez/core-utils@0.2.1

## 0.2.2

### Patch Changes

- 0d71f33: re-export Envelop from core
- 3c3d047: add HelixContext types
- Updated dependencies [0d71f33]
- Updated dependencies [9a7038b]
  - @graphql-ez/core-types@0.2.2

## 0.2.1

### Patch Changes

- eed0c92: use custom graphql-helix types
- Updated dependencies [eed0c92]
  - @graphql-ez/core-types@0.2.1

## 0.2.0

### Minor Changes

- 28ca48d: [BREAKING CHANGE] Plugin based complete restructure - Please check https://github.com/PabloSzx/graphql-ez/tree/main/examples

### Patch Changes

- Updated dependencies [28ca48d]
  - @graphql-ez/core-types@0.2.0
  - @graphql-ez/core-utils@0.2.0
