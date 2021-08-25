# @graphql-ez/plugin-graphiql

Integration with [GraphiQL IDE](https://github.com/graphql/graphiql)

## Usage

```ts
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';

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
       * By default it's the same as the main API path, normally `"/graphql"` or `"/api/graphql"`
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
       *
       * If no `subscriptionsEndpoint` is specified and `subscriptionsProtocol` is set to **"WS"** or **"LEGACY_WS"**,
       * it automatically reuses the `endpoint` with the current browser window URL with the protocol "ws://" or "wss://"
       */
      subscriptionsEndpoint?: string;
      /**
       * The Subscriptions protocol used.
       *
       * If no protocol is specified, it fallbacks to Server-Sent Events aka **"SSE"**
       */
      subscriptionsProtocol?: 'WS' | 'LEGACY_WS' | 'SSE';

      /**
       * Enable selecting subscriptions protocol via dropdown in interface
       */
      hybridSubscriptionTransportConfig?: {
        default: 'sse' | 'legacyWS' | 'transportWS';
        config: {
          /* Enable SSE transport as an option, if set as "true", it re-uses `endpoint` */
          sse?: string | boolean;
          /* Enable Legacy graphql-ws protocol transport as an option, if set as "true", re-uses `endpoint` with "ws:" or "wss:" protocol */
          legacyWS?: string | boolean;
          /* Enable graphql-transport-ws protocol transport as an option, if set as "true" re-uses `endpoint` with "ws:" or "wss:" protocol */
          transportWS?: string | boolean;
        };
      };
    }
  | boolean;
```

### Next.js Usage

For Next.js you can either use this plugin's handler explicitly in your API routes,
for example, following the file structure: `/pages/api/graphiql.ts`, and using this snippet:

```ts
// /pages/api/graphiql.ts
import { GraphiQLHandler } from '@graphql-ez/plugin-graphiql';

export default GraphiQLHandler({
  endpoint: '/api/graphql',
});
```

Or simply add the plugin in your EZ App and it will be served in the same path of your GraphQL API

```ts
import { CreateApp } from '@graphql-ez/nextjs';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';

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
