# @graphql-ez/plugin-websockets

Integration with:

- GraphQL over WebSocket Protocol - [graphql-ws](https://github.com/enisdenjo/graphql-ws)
- Legacy Support for [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws) (using a fork called [subscriptions-transport-ws-envelop](https://www.npmjs.com/package/subscriptions-transport-ws-envelop))

## Usage

```ts
import { ezWebSockets } from '@graphql-ez/plugin-websockets';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezWebSockets('adaptive'),
      // ...
    ],
  },
  // ...
});
```

```ts
export type WebSocketOptions =
  // If you enable both protocols, it will automatically adapt to the correct protocol based on the client
  | {
      subscriptionsTransport?:
        | {
            rootValue?: any;
            validationRules?: readonly any[] | ((context: ValidationContext) => any)[];
            onOperation?: Function;
            onOperationComplete?: Function;
            onDisconnect?: Function;
            keepAlive?: number;
          }
        | boolean;
      // Check https://github.com/enisdenjo/graphql-ws/blob/master/docs/interfaces/server.serveroptions.md
      graphQLWS?: Omit<GraphQLWSOptions, 'schema' | 'execute' | 'subscribe' | 'context' | 'validate' | 'onSubscribe'> | boolean;
      wsOptions?: {
        verifyClient?:
          | ((
              info: {
                origin: string;
                secure: boolean;
                req: IncomingMessage;
              },
              callback: (res: boolean, code?: number, message?: string, headers?: OutgoingHttpHeaders) => void
            ) => void)
          | ((info: { origin: string; secure: boolean; req: IncomingMessage }) => boolean);
        clientTracking?: boolean;
        perMessageDeflate?: boolean | PerMessageDeflateOptions;
        maxPayload?: number;
      };
    }
  // Only use graphql-ws library protocol
  | 'new'
  // Only use legacy subscriptions-transport-ws protocol
  | 'legacy'
  // Automatically use the correct protocol based on the client, the default value
  | 'adaptive';
```

### Next.js Compatibility

This plugin is not supported for `Next.js`, since it follows the serverless architecture, and [Websockets are not supported](https://vercel.com/docs/platform/limits#websockets) in serverless.

If you really need websockets for `Next.js`, you can use libraries like [fastify-nextjs](https://github.com/fastify/fastify-nextjs) to use [Fastify](https://www.graphql-ez.com/docs/integrations/fastify) as a [custom server for Next.js](https://nextjs.org/docs/advanced-features/custom-server).
