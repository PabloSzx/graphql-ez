# @graphql-ez/plugin-codegen

Integration with [GraphQL Code Generator](https://www.graphql-code-generator.com/)

## Usage

```ts
import { ezCodegen } from '@graphql-ez/plugin-codegen';

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezCodegen({
        // Options
      }),
      // ...
    ],
  },
  // ...
});
```

### Options

The `config` property extends the options of:

- [TypeScript plugin](https://www.graphql-code-generator.com/docs/plugins/typescript)
- [TypeScript Resolvers plugin](https://www.graphql-code-generator.com/docs/plugins/typescript-resolvers)
- [TypeScript Operations plugin](https://www.graphql-code-generator.com/docs/plugins/typescript-operations)
- [TypedDocumentNode plugin](https://www.graphql-code-generator.com/docs/plugins/typed-document-node)

```ts
export interface CodegenConfig
  extends TypeScriptPluginConfig,
    TypeScriptResolversPluginConfig,
    TypeScriptDocumentsPluginConfig,
    TypeScriptTypedDocumentNodesConfig {
  /**
   * @description
   * Will use import type {} rather than import {} when importing only types.
   *
   * This gives also add compatibility with TypeScript's "importsNotUsedAsValues": "error" option
   *
   * @default true
   */
  useTypeImports?: boolean;

  /**
   * Enable deep partial type resolvers
   *
   * @default true
   */
  deepPartialResolvers?: boolean;

  /**
   * Generated target path
   *
   * @default "./src/ez.generated.ts"
   */
  targetPath?: string;

  /**
   * Add arbitrary code at the beginning of the generated code
   */
  preImportCode?: string;

  /**
   * Handle Code Generation errors
   * @default console.error
   */
  onError?: (err: unknown) => void;

  /**
   * Custom Code Generation finish callback
   */
  onFinish?: () => void;

  /**
   * GraphQL Codegen plugin context
   */
  pluginContext?: Record<string, any>;

  /**
   * Extra plugins map
   */
  extraPluginsMap?: Record<string, CodegenPlugin<any>>;

  /**
   * Extra plugins config
   */
  extraPluginsConfig?: Types.ConfiguredPlugin[];

  /**
   * Asynchronously loads executable documents (i.e. operations and fragments) from
   * the provided pointers. The pointers may be individual files or a glob pattern.
   * The files themselves may be `.graphql` files or `.js` and `.ts` (in which
   * case they will be parsed using graphql-tag-pluck).
   */
  documents?: UnnormalizedTypeDefPointer | UnnormalizedTypeDefPointer[];

  /**
   * Documents config
   */
  documentsConfig?: {
    /**
     * @default true
     */
    useTypedDocumentNode?: boolean;

    /**
     * Configuration used while loading the documents
     */
    loadDocuments?: Partial<LoadTypedefsOptions>;
  };

  /**
   * Skip documents validation
   */
  skipDocumentsValidation?: boolean;

  /**
   * Transform the generated code
   */
  transformGenerated?: (code: string) => string | Promise<string>;

  /**
   * Custom document loaders
   */
  documentsLoaders?: Loader<string, SingleFileOptions>[];
}

export interface CodegenOptions {
  /**
   * Enable code generation, by default is enabled if `NODE_ENV` is not `production` nor `test`
   *
   * @default process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test"
   */
  enableCodegen?: boolean;

  /**
   * Add custom codegen config
   */
  config?: CodegenConfig;

  /**
   * Output schema target path or flag
   *
   * If `true`, defaults to `"./schema.gql"`
   * You have to specify a `.gql`, `.graphql` or `.json` extension
   *
   * @default false
   */
  outputSchema?: boolean | string | string[];
}
```
