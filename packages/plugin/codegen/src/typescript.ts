import { GraphQLSchema, parse } from 'graphql';
import { resolve } from 'path';

import { printSchemaWithDirectives, Loader } from '@graphql-tools/utils';

import { cleanObject, toPlural } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import { formatPrettier } from './prettier';
import { writeFileIfChanged } from './write';

import type { CodegenPlugin, Types } from '@graphql-codegen/plugin-helpers';
import type { Source } from '@graphql-tools/utils';
import type { LoadTypedefsOptions, UnnormalizedTypeDefPointer } from '@graphql-tools/load';
import type { TypeScriptPluginConfig } from '@graphql-codegen/typescript';
import type { TypeScriptResolversPluginConfig } from '@graphql-codegen/typescript-resolvers';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations';
import type { TypeScriptTypedDocumentNodesConfig } from '@graphql-codegen/typed-document-node';

import type { InternalAppBuildContext } from 'graphql-ez';

export interface CodegenDocumentsConfig {
  /**
   * @default true
   */
  useTypedDocumentNode?: boolean;

  /**
   * Configuration used while loading the documents
   */
  loadDocuments?: Partial<LoadTypedefsOptions>;
}

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
   * Add arbitrary code at the end of the generated code
   */
  postGeneratedCode?: string[] | string;

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
  documentsConfig?: CodegenDocumentsConfig;

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
  documentsLoaders?: Loader[];
}

const CodegenDeps = LazyPromise(async () => {
  const [{ codegen }, typescriptPlugin, typescriptOperationsPlugin, typescriptResolversPlugin] = await Promise.all([
    import('@graphql-codegen/core'),
    import('@graphql-codegen/typescript'),
    import('@graphql-codegen/typescript-operations'),
    import('@graphql-codegen/typescript-resolvers'),
  ]);

  return {
    codegen,
    typescriptPlugin,
    typescriptOperationsPlugin,
    typescriptResolversPlugin,
  };
});

export async function EnvelopTypeScriptCodegen(executableSchema: GraphQLSchema, ctx: InternalAppBuildContext): Promise<void> {
  const schema = parse(printSchemaWithDirectives(executableSchema));

  const {
    targetPath = './src/ez.generated.ts',
    deepPartialResolvers = true,
    preImportCode = '',
    scalars: customScalars,
    onError = console.error,
    pluginContext,
    skipDocumentsValidation,
    documents: documentsArg,
    documentsConfig = {},
    extraPluginsMap,
    extraPluginsConfig,
    transformGenerated,
    documentsLoaders,
    postGeneratedCode,
    ...codegenOptions
  } = ctx.codegen?.config || {};

  const { useTypedDocumentNode = true, loadDocuments: loadDocumentsConfig } = documentsConfig;

  const scalars =
    typeof customScalars === 'string'
      ? customScalars
      : {
          ...(customScalars || {}),
          ...(ctx.GraphQLUpload
            ? {
                Upload: 'Promise<import("graphql-upload").FileUpload>',
              }
            : {}),
        };

  const config: TypeScriptPluginConfig &
    TypeScriptResolversPluginConfig &
    TypeScriptDocumentsPluginConfig &
    TypeScriptTypedDocumentNodesConfig = {
    useTypeImports: true,
    customResolverFn: deepPartialResolvers
      ? `(parent: TParent, args: TArgs, context: TContext, info: GraphQLResolveInfo) => Promise<import("graphql-ez").DeepPartial<TResult>> | import("graphql-ez").DeepPartial<TResult>`
      : undefined,
    scalars,
    contextType: `graphql-ez#EZContext`,
    ...codegenOptions,
  };

  const { codegen, typescriptPlugin, typescriptResolversPlugin, typescriptOperationsPlugin } = await CodegenDeps;

  const pluginMap: Record<string, CodegenPlugin<any>> = {
    typescript: typescriptPlugin,
    typescriptResolvers: typescriptResolversPlugin,
    typescriptOperations: typescriptOperationsPlugin,
    ...cleanObject(extraPluginsMap),
  };

  const documents: Source[] = [];

  if (documentsArg) {
    const [{ loadDocuments }, { GraphQLFileLoader }, typedDocumentNode] = await Promise.all([
      import('@graphql-tools/load'),
      import('@graphql-tools/graphql-file-loader'),
      useTypedDocumentNode ? import('@graphql-codegen/typed-document-node') : null,
    ]);

    const loadedDocuments = await loadDocuments(documentsArg, {
      loaders: [new GraphQLFileLoader(), ...(documentsLoaders || [])],
      ...cleanObject(loadDocumentsConfig),
    });

    documents.push(...loadedDocuments);

    if (typedDocumentNode) pluginMap.typedDocumentNode = typedDocumentNode;
  }

  const codegenCode = await codegen({
    schema,
    documents,
    config,
    filename: 'ez.generated.ts',
    pluginMap,
    plugins: [
      {
        typescript: {},
      },
      {
        typescriptResolvers: {},
      },
      {
        typescriptOperations: {},
      },
      ...(useTypedDocumentNode && documentsArg
        ? [
            {
              typedDocumentNode: {},
            },
          ]
        : []),
      ...(extraPluginsConfig || []),
    ],
    pluginContext,
    skipDocumentsValidation,
  });

  let code = await formatPrettier(
    `
  ${preImportCode}
  ${codegenCode}

  declare module "graphql-ez" {
      interface EZResolvers extends Resolvers<import("graphql-ez").EZContext> { }
  }

  ${toPlural(postGeneratedCode).join('\n')}

`,
    'typescript'
  );

  if (transformGenerated) {
    code = await formatPrettier(await transformGenerated(code), 'typescript');
  }

  await writeFileIfChanged(resolve(targetPath), code).catch(onError);
}
