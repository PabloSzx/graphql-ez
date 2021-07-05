# @graphql-ez/plugin-graphiql

Integration with [GraphiQL IDE](https://github.com/graphql/graphiql)

## Usage

```ts
import { ezGraphiQLIDE } from '@graphql-ez/plugin-altair';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezGraphiQLIDE({
        // Options
      }),
      // ...
    ],
  },
  // ...
});
```

### Options

Most of these types come from [graphql-helix Graphiql](https://github.com/contrawork/graphql-helix/blob/master/packages/core/lib/types.ts)

```ts
type GraphiQLOptions =
  | {
      /**
       * @default "/graphiql"
       */
      path?: string;

      /**
       * An optional GraphQL string to use when no query is provided and no stored
       * query exists from a previous session.  If undefined is provided, GraphiQL
       * will use its own default query.
       */
      defaultQuery?: string;
      /**
       * Whether to open the variable editor by default. Defaults to `true`.
       */
      defaultVariableEditorOpen?: boolean;
      /**
       * The endpoint requests should be sent. Defaults to `"/graphql"`.
       */
      endpoint?: string;
      /**
       * The initial headers to render inside the header editor. Defaults to `"{}"`.
       */
      headers?: string;
      /**
       * Whether the header editor is enabled. Defaults to `true`.
       */
      headerEditorEnabled?: boolean;
      /**
       * A cryptographic nonce for use with Content-Security-Policy.
       */
      nonce?: string;
      /**
       * The endpoint subscription requests should be sent to. Defaults to the value of the `endpoint` parameter.
       */
      subscriptionsEndpoint?: string;
      /**
       * Use legacy web socket protocol `graphql-ws` instead of the more current standard `graphql-transport-ws`
       */
      useWebSocketLegacyProtocol?: boolean;
    }
  | boolean;
```

### Next.js Usage

In Next.js you need to use this plugin's handler explicitly in your API routes,
for example, following the file structure: `/pages/api/graphiql.ts`, and using this snippet:

```ts
// /pages/api/graphiql.ts
import { GraphiQLHandler } from '@graphql-ez/plugin-graphiql';

export default GraphiQLHandler({
  endpoint: '/api/graphql',
});
```
