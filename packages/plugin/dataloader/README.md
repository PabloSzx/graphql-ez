# @graphql-ez/plugin-dataloader

Integration with [DataLoader](https://github.com/graphql/dataloader)

Check https://www.graphql-ez.com for more information

## Usage

This plugins adds an extra `registerDataLoader` in your `ezApp`, which will automatically add the specified dataloader in your GraphQL EZ Application Context.

This EZ Plugin uses [@envelop/dataloader](https://github.com/dotansimha/envelop/tree/main/packages/plugins/dataloader) plugin seamlessly while you code

```ts
import { ezDataLoader } from '@graphql-ez/plugin-dataloader';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezDataLoader(),
      // ...
    ],
  },
  // ...
});

// ...

import type { InferDataLoader } from '@graphql-ez/plugin-dataloader';

const multiplierDataLoader = ezApp.registerDataLoader(
  'Multiplier',
  DataLoader =>
    new DataLoader<number, number>(async numbers => {
      return numbers.map(v => v * 2);
    })
);

// This snippet add automatically the type of your DataLoader in your EZContext
declare module 'graphql-ez' {
  interface EZContext extends InferDataLoader<typeof multiplierDataLoader> {}
}

// And if you are using https://www.graphql-ez.com/plugins/graphql-modules
// You could use it like this:

ezApp.registerModule(
  gql`
    extend type Query {
      multiply(n: Float!): Float!
    }
  `,
  {
    resolvers: {
      Query: {
        multiply(_root, { n }, { Multiplier }) {
          return Multiplier.load(n);
        },
      },
    },
  }
);
```
