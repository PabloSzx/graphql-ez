# @graphql-ez/plugin-sse

Integration with [graphql-sse](https://github.com/enisdenjo/graphql-sse) - [GraphQL over Server-Sent Events Protocol](https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md)

## Compatibility

This plugins supports:

- [Fastify](https://www.graphql-ez.com/docs/integrations/fastify)
- [Express](https://www.graphql-ez.com/docs/integrations/express)
- [Koa](https://www.graphql-ez.com/docs/integrations/koa)
- [Node.js HTTP](https://www.graphql-ez.com/docs/integrations/http)
- [Hapi](https://www.graphql-ez.com/docs/integrations/hapi)

## Options

Check [HandlerOptions graphql-sse docs](https://github.com/enisdenjo/graphql-sse/blob/master/docs/interfaces/handler.HandlerOptions.md) for some information, from there, you can ignore `'execute'`, `'subscribe'`, `'validate'`, `'onSubscribe'` `'schema'` and `'context'`

## Usage

```ts
import { ezSSE } from '@graphql-ez/plugin-sse';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezSSE({
        options: {
          // ...
        },
        // "/graphql/stream" is the default
        path: '/graphql/stream',
      }),
      // ...
    ],
  },
  // ...
});
```

## Credits

Thanks to [@enisdenjo](https://github.com/enisdenjo) for working on this awesome library and protocol
