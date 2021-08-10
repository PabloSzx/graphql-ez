# @graphql-ez/plugin-schema

Integration with [@graphql-tools/schema](https://www.graphql-tools.com/docs/generate-schema/) and [@graphql-tools/merge](https://www.npmjs.com/package/@graphql-tools/merge)

It can combine with other EZ Plugins like [GraphQL Scalars](https://www.graphql-ez.com/plugins/graphql-scalars) and [GraphQL Codegen](https://www.graphql-ez.com/plugins/graphql-scalars).

## Usage

### registerTypeDefs and registerResolvers

You can use extra helpers that this plugin adds to your builder:

These helpers are specially useful when your API deals with a big amount of different type definitions and resolvers present in a lot of different directories, since you could simply call these functions, and you will only need to import them before calling `buildApp(...)`, and this plugin will greatly simplify your code.

```ts
import { ezSchema } from '@graphql-ez/plugin-schema';

export const { registerTypeDefs, registerResolvers, buildApp, gql } = CreateApp({
  // ...
  ez: {
    plugins: [
      //...
      ezSchema(),
    ],
  },
});

// ...


registerTypeDefs(gql`
type Query {
  hello: String!
}
`)

registerResolvers({
  Query: {
    hello() {
      return "Hello World!"
    }
  }
});


// ...

buildApp()
```

### EZSchema

You can also define an EZSchema which has all the types to make an executable schema.

```ts
import { ezSchema, EZSchema, gql } from '@graphql-ez/plugin-schema';

const schema: EZSchema = {
  typeDefs: gql`
    type Query {
      hello: String!
    }
  `,
  resolvers: {
    Query: {
      hello(_root, _args, ctx) {
        return 'world';
      },
    },
  },
};

CreateApp({
  // ...
  ez: {
    plugins: [
      // ...
      ezSchema({
        schema,
      }),
    ],
  },
});
```

### Multiple schemas

You can specify multiple schemas, and it will automatically merge the schemas.

```ts
CreateApp({
  // ...
  schema: [schema1, schema2, schema3],
});
```

You can customize the merging behavior following the [@graphql-tools/merge](https://www.graphql-tools.com/docs/schema-merging) options

```ts
ezSchema({
  // ...
  schema: [schema1, schema2, schema3],

  // Check https://www.graphql-tools.com/docs/schema-merging
  mergeSchemasConfig: {
    // ...
  },
});
```
