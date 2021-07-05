# @graphql-ez/plugin-voyager

Integration with [GraphQL Voyager](https://apis.guru/graphql-voyager/)

## Usage

```ts
import { ezVoyager } from '@graphql-ez/plugin-voyager';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezVoyager({
        // Options
      }),
      // ...
    ],
  },
  // ...
});
```

### Options

Most of these types come from [GraphQL Voyager properties](https://github.com/APIs-guru/graphql-voyager#properties)

```ts
type VoyagerPluginOptions =
  | {
      /**
       * @default "/voyager"
       */
      path?: string;

      /**
       * Manually transform the rendered HTML
       */
      transformHtml?: (html: string) => string;

      endpointUrl?: string;

      headers?: string | Record<string, unknown>;

      displayOptions?: {
        rootType?: string;
        skipRelay?: boolean;
        skipDeprecated?: boolean;
        showLeafFields?: boolean;
        sortByAlphabet?: boolean;
        hideRoot?: boolean;
      };

      credentials?: 'same-origin' | 'include' | 'omit';
    }
  | boolean;
```

### Next.js Usage

In Next.js you need to use this plugin's handler explicitly in your API routes,
for example, following the file structure: `/pages/api/voyager.ts`, and using this snippet:

```ts
// /pages/api/voyager.ts
import { VoyagerHandler } from '@graphql-ez/plugin-voyager';

export default VoyagerHandler({
  endpointUrl: '/api/graphql',
});
```
