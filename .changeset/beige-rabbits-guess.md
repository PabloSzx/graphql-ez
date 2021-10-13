---
'@graphql-ez/plugin-upload': patch
'@graphql-ez/plugin-websockets': patch
---

Fix: remove dynamic imports due to jest/v8 bug, change interop method for specific problematic dependencies

See:

- https://bugs.chromium.org/p/v8/issues/detail?id=10284
- https://github.com/nodejs/node/issues/36351
- https://github.com/facebook/jest/issues/11438
