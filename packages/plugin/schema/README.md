# @graphql-ez/plugin-schema

Integration with [@graphql-tools/schema](https://www.graphql-tools.com/docs/generate-schema/) and [@graphql-tools/merge](https://www.npmjs.com/package/@graphql-tools/merge)

It can combine with other EZ Plugins like [GraphQL Scalars](https://www.graphql-ez.com/plugins/graphql-scalars) and [GraphQL Codegen](https://www.graphql-ez.com/plugins/graphql-scalars).

## Usage

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
