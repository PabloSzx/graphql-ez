# @graphql-ez/plugin-altair

## 0.9.1

### Patch Changes

- aea634c: Fix missing endpoint handler config

## 0.9.0

### Minor Changes

- 7f36a2a: Rename "endpointURL" and "endpointUrl" to "endpoint" to align plugins configuration

## 0.8.0

### Minor Changes

- e99511d: Change "compatibilityList" signature
- e99511d: Refactor onIntegrationRegister logic

### Patch Changes

- Updated dependencies [e99511d]
- Updated dependencies [e99511d]
- Updated dependencies [e99511d]
  - graphql-ez@0.13.0

## 0.7.1

### Patch Changes

- d052802: Add support for Vercel
- 808e9c5: fix unpkg altair handler options
- Updated dependencies [cc0c9eb]
  - graphql-ez@0.12.7

## 0.7.0

### Minor Changes

- 6841a11: add support for Cloudflare Workers

## 0.6.0

### Minor Changes

- 7828f5e: Add support for SvelteKit
- 7828f5e: simplify Render logic with "/render/static" and "/render/unpkg"

### Patch Changes

- Updated dependencies [2d23436]
- Updated dependencies [7828f5e]
  - graphql-ez@0.12.6

## 0.5.2

### Patch Changes

- 04e90c1: add `"sideEffects": false` for tree-shaking
- Updated dependencies [04e90c1]
  - graphql-ez@0.12.5
  - @graphql-ez/utils@0.1.2

## 0.5.1

### Patch Changes

- e82d784: update altair to 4.0.9
  - graphql-ez@0.12.4

## 0.5.0

### Minor Changes

- 272c4cc: separate @graphql-ez/utils package

### Patch Changes

- Updated dependencies [272c4cc]
- Updated dependencies [655cea4]
- Updated dependencies [b0c307a]
- Updated dependencies [655cea4]
  - graphql-ez@0.12.0
  - @graphql-ez/utils@0.1.0

## 0.4.3

### Patch Changes

- Updated dependencies [8106a74]
  - graphql-ez@0.11.0

## 0.4.2

### Patch Changes

- Updated dependencies [b1c27d1]
- Updated dependencies [faff0ad]
  - graphql-ez@0.10.0

## 0.4.1

### Patch Changes

- 8c6059c: use [altair-static-slim](https://github.com/PabloSzx/altair-static-slim), which eliminates all useless dependencies from altair-static

## 0.4.0

### Minor Changes

- 0d8cf81: update Envelop to v1.0

### Patch Changes

- 7cfd60b: update altair
- Updated dependencies [0731fc3]
- Updated dependencies [0d8cf81]
  - graphql-ez@0.9.0

## 0.3.5

### Patch Changes

- aaf29e1: pin altair-static version until upgrade

## 0.3.4

### Patch Changes

- Updated dependencies [9d5b497]
  - graphql-ez@0.8.0

## 0.3.3

### Patch Changes

- Updated dependencies [75683b8]
  - graphql-ez@0.7.0

## 0.3.2

### Patch Changes

- Updated dependencies [b2dd453]
- Updated dependencies [0f4c31b]
  - graphql-ez@0.6.0

## 0.3.1

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

## 0.1.2

### Patch Changes

- d2d11b2: reference https://www.graphql-ez.com website
- 89e875c: add support for presets
- 97fbadc: minor fixes
- Updated dependencies [d2d11b2]
- Updated dependencies [89e875c]
  - @graphql-ez/core-types@0.2.4
  - @graphql-ez/core-utils@0.2.2

## 0.1.1

### Patch Changes

- 8c8389a: improve vanilla EZResolvers using graphql-tools types
- 6f05eab: set required Node.js engines
- Updated dependencies [8c8389a]
- Updated dependencies [6f05eab]
  - @graphql-ez/core-types@0.2.3
  - @graphql-ez/core-utils@0.2.1

## 0.1.0

### Minor Changes

- 28ca48d: [BREAKING CHANGE] Plugin based complete restructure - Please check https://github.com/PabloSzx/graphql-ez/tree/main/examples

### Patch Changes

- Updated dependencies [28ca48d]
  - @graphql-ez/core-types@0.2.0
  - @graphql-ez/core-utils@0.2.0
