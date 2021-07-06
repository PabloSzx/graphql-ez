# @graphql-ez/plugin-upload

Integration with [GraphQL Upload](https://github.com/jaydenseric/graphql-upload)

## Compatibility

This plugin currently only supports [Fastify](https://www.graphql-ez.com/docs/integrations/fastify), [Express](https://www.graphql-ez.com/docs/integrations/express) and [Koa](https://www.graphql-ez.com/docs/integrations/koa). If you really need this plugin in another integration, feel free to create [an issue](https://github.com/PabloSzx/graphql-ez/issues) or [a PR](https://github.com/PabloSzx/graphql-ez/pulls) proposing the solution.

## Usage

> Make sure to have installed [graphql-upload](https://www.npmjs.com/package/graphql-upload) and [@types/graphql-upload](https://www.npmjs.com/package/@types/graphql-upload), since these are set as [Peer Dependencies](https://nodejs.org/es/blog/npm/peer-dependencies/)

> This plugin integrates automatically with the [GraphQL Codegen plugin](https://www.graphql-ez.com/plugins/codegen)

```ts
import { ezUpload } from '@graphql-ez/plugin-upload';

const ezApp = CreateApp({
  ez: {
    plugins: [
      // ...
      ezUpload({
        // UploadOptions
      }),
    ],
  },
  // ...
});
```

```ts
export interface UploadOptions {
  maxFieldSize?: number;
  maxFileSize?: number;
  maxFiles?: number;
}
```

```ts
// You also can use a helper exported from this plugin
// that automatically converts the graphql-upload ReadStream
// into a more developer-friendly "Buffer"
import { readStreamToBuffer } from '@graphql-ez/plugin-upload';

// ...
({
  // ...
  typeDefs: [
    // ...
    gql`
      type Mutation {
        uploadFileToBase64(file: Upload!): String!
      }
    `,
  ],
  resolvers: {
    // ...
    Mutation: {
      async uploadFileToBase64(_root, { file }, _ctx) {
        const fileBuffer = await readStreamToBuffer(file);

        return fileBuffer.toString('base64');
      },
    },
  },
});
```
