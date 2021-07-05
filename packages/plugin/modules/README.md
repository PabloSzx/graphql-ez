# @graphql-ez/plugin-modules

Integration with [GraphQL Modules](https://www.graphql-modules.com/)

## Usage

This plugin add an extra `registerModule` helper in your `ezApp`, which will automatically add the specified GraphQL Module in your GraphQL EZ Application,
this plugin will take care of the rest.

This plugin works the best paired with the [GraphQL Code Generator plugin](https://www.graphql-ez.com/plugins/codegen) with the option `deepPartialResolvers` enabled (_`already enabled by default`_)

```ts
import { ezGraphQLModules, gql } from '@graphql-ez/plugin-modules';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezGraphQLModules({
        // ApplicationConfig https://www.graphql-modules.com/docs/api#applicationconfig
      }),
      // ...
    ],
  },
  // ...
});

// ...

ezApp.registerModule(
  gql`
    type Query {
      hello: String!
    }
  `,
  {
    resolvers: {
      Query: {
        hello(_root, _args, _ctx) {
          return 'Hello World';
        },
      },
    },
  }
);

// ...

ezApp.registerModule(
  gql`
    extend type Query {
      bye: String!
    }
  `,
  {
    resolvers: {
      Query: {
        bye(_root, _args, _ctx) {
          return 'Bye World';
        },
      },
    },
  }
);
```
