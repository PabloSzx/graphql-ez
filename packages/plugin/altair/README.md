# @graphql-ez/plugin-altair

Integration with [Altair GraphQL Client IDE](https://altair.sirmuel.design/)

## Usage

```ts
import { ezAltairIDE } from '@graphql-ez/plugin-altair';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezAltairIDE({
        // Options
      }),
      // ...
    ],
  },
  // ...
});
```

### Options

Most of these types come from [altair-static](https://github.com/altair-graphql/altair/tree/staging/packages/altair-static) 

```ts
type AltairOptions =
  | {
      /**
       * @default "/altair"
       */
      path?: string;

      /**
       * URL to be used as a base for relative URLs
       */
      baseURL?: string;
      /**
       * Whether to render the initial options in a separate javascript file or not.
       * Use this to be able to enforce strict CSP rules.
       * @default false
       */
      serveInitialOptionsInSeperateRequest?: boolean;

      /**
       * URL to set as the server endpoint
       */
      endpointURL?: string;
      /**
       * URL to set as the subscription endpoint
       */
      subscriptionsEndpoint?: string;
      /**
       * Initial query to be added
       */
      initialQuery?: string;
      /**
       * Initial variables to be added
       */
      initialVariables?: string;
      /**
       * Initial pre-request script to be added
       */
      initialPreRequestScript?: string;
      /**
       * Initial post-request script to be added
       */
      initialPostRequestScript?: string;
      /**
       * Initial headers object to be added
       * @example
       * {
       *  'X-GraphQL-Token': 'asd7-237s-2bdk-nsdk4'
       * }
       */
      initialHeaders?: IDictionary;
      /**
       * Initial Environments to be added
       * @example
       * {
       *   base: {
       *     title: 'Environment',
       *     variables: {}
       *   },
       *   subEnvironments: [
       *     {
       *       title: 'sub-1',
       *       variables: {}
       *     }
       *   ]
       * }
       */
      initialEnvironments?: IInitialEnvironments;
      /**
       * Namespace for storing the data for the altair instance.
       * Use this when you have multiple altair instances running on the same domain.
       * @example
       * instanceStorageNamespace: 'altair_dev_'
       */
      instanceStorageNamespace?: string;
      /**
       * Initial app settings to use
       */
      initialSettings?: Partial<SettingsState>;
      /**
       * Initial subscriptions provider
       *
       * @default "websocket"
       */
      initialSubscriptionsProvider?: SubscriptionProviderIds;
      /**
       * Initial subscriptions connection params
       */
      initialSubscriptionsPayload?: IDictionary;
      /**
       * Indicates if the state should be preserved for subsequent app loads
       *
       * @default true
       */
      preserveState?: boolean;
      /**
       * HTTP method to use for making requests
       */
      initialHttpMethod?: HttpVerb;
    }
  | boolean;
```

### Unpkg Version

This plugin also provides a version of Altair that is hosted by [Unpkg](https://unpkg.com/), which is very useful when you are bundling your API, since the static files of Altair might not be included in your final bundle, but it will require an internet connection from your API.

```ts
import { ezUnpkgAltairIDE } from '@graphql-ez/plugin-altair';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezUnpkgAltairIDE({
        // Options
      }),
      // ...
    ],
  },
  // ...
});
```

### Next.js Usage

In Next.js you need to use this plugin's handler explicitly in your API routes,
for example, following the file structure: `/pages/api/altair/[[...any]].ts`, and using this snippet:

```ts
// /pages/api/altair/[[...any]].ts
import { UnpkgAltairHandler } from '@graphql-ez/plugin-altair';

export default UnpkgAltairHandler({
  path: '/api/altair',
  endpointURL: '/api/graphql',
});
```
