# @graphql-ez/plugin-scalars

Integration with [GraphQL Scalars](https://www.graphql-scalars.dev/)

## Usage

Check the [website docs](https://www.graphql-scalars.dev/docs/introduction) to see all available scalars, of you can inspect the types of the plugin

```ts
import { ezScalars } from '@graphql-ez/plugin-scalars';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezScalars({
        // ...
      }),
      // ...
    ],
  },
});
```

This plugin accepts different syntaxes:

### Wildcard

If you specify "\*", every scalar is added to you GraphQL Schema.

```ts
ezScalars('*');
```

### Array

```ts
ezScalars(['DateTime', 'JSONObject']);
```

### Object

```ts
ezScalars({
  // You can use `1` | `0`
  DateTime: 1,
  // or `true` | `false`
  JSONObject: true,
});
```
