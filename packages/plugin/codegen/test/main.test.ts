import { outputFile, readFile } from 'fs-extra';
import { buildClientSchema, printSchema } from 'graphql';
import { CommonSchema, createDeferredPromise, LazyPromise, startFastifyServer, TearDownPromises } from 'graphql-ez-testing';
import { resolve } from 'path';
import tmp from 'tmp-promise';
import { ezCodegen } from '../src';

test('typescript resolvers', async () => {
  const tempDir = await tmp.dir({
    unsafeCleanup: true,
  });

  TearDownPromises.push(LazyPromise(() => tempDir.cleanup()));

  const targetPath = resolve(tempDir.path, 'ez.generated.ts');
  const schemaGqlPath = resolve(tempDir.path, 'schema.gql');
  const schemaJsonPath = resolve(tempDir.path, 'schema.json');

  const tempDocumentPath = resolve(tempDir.path, 'doc.gql');

  await outputFile(
    tempDocumentPath,
    `
  query hello {
      hello
  }
  `
  );

  const codegenDone = createDeferredPromise();

  await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      ez: {
        plugins: [
          ezCodegen({
            enableCodegen: true,
            config: {
              targetPath,
              onFinish: codegenDone.resolve,
              onError: codegenDone.reject,
              documents: [tempDocumentPath],
              postGeneratedCode: "export type HelloWorld = 'Hello World!'",
            },
            outputSchema: [schemaGqlPath, schemaJsonPath],
          }),
        ],
      },
    },
  });

  await codegenDone.promise;

  expect(
    await readFile(targetPath, {
      encoding: 'utf-8',
    })
  ).toMatchInlineSnapshot(`
    "import type { GraphQLResolveInfo } from 'graphql';
    import type { EZContext } from 'graphql-ez';
    import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
    export type Maybe<T> = T | null;
    export type InputMaybe<T> = Maybe<T>;
    export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
    export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
    export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
    export type ResolverFn<TResult, TParent, TContext, TArgs> = (
      parent: TParent,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo
    ) => Promise<import('graphql-ez').DeepPartial<TResult>> | import('graphql-ez').DeepPartial<TResult>;
    /** All built-in and custom scalars, mapped to their actual values */
    export type Scalars = {
      ID: string;
      String: string;
      Boolean: boolean;
      Int: number;
      Float: number;
    };

    export type Query = {
      __typename?: 'Query';
      hello: Scalars['String'];
      users: Array<User>;
      stream?: Maybe<Array<Scalars['String']>>;
      context: Scalars['String'];
    };

    export type User = {
      __typename?: 'User';
      id: Scalars['Int'];
    };

    export type ResolverTypeWrapper<T> = Promise<T> | T;

    export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
      resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
    };
    export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
      | ResolverFn<TResult, TParent, TContext, TArgs>
      | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

    export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
      parent: TParent,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo
    ) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

    export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
      parent: TParent,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo
    ) => TResult | Promise<TResult>;

    export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
      subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
      resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
    }

    export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
      subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
      resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
    }

    export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
      | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
      | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

    export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
      | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
      | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

    export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
      parent: TParent,
      context: TContext,
      info: GraphQLResolveInfo
    ) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

    export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
      obj: T,
      context: TContext,
      info: GraphQLResolveInfo
    ) => boolean | Promise<boolean>;

    export type NextResolverFn<T> = () => Promise<T>;

    export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
      next: NextResolverFn<TResult>,
      parent: TParent,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo
    ) => TResult | Promise<TResult>;

    /** Mapping between all available schema types and the resolvers types */
    export type ResolversTypes = {
      Query: ResolverTypeWrapper<{}>;
      String: ResolverTypeWrapper<Scalars['String']>;
      User: ResolverTypeWrapper<User>;
      Int: ResolverTypeWrapper<Scalars['Int']>;
      Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
    };

    /** Mapping between all available schema types and the resolvers parents */
    export type ResolversParentTypes = {
      Query: {};
      String: Scalars['String'];
      User: User;
      Int: Scalars['Int'];
      Boolean: Scalars['Boolean'];
    };

    export type DeferDirectiveArgs = {
      if?: Maybe<Scalars['Boolean']>;
      label?: Maybe<Scalars['String']>;
    };

    export type DeferDirectiveResolver<Result, Parent, ContextType = EZContext, Args = DeferDirectiveArgs> = DirectiveResolverFn<
      Result,
      Parent,
      ContextType,
      Args
    >;

    export type StreamDirectiveArgs = {
      if?: Maybe<Scalars['Boolean']>;
      label?: Maybe<Scalars['String']>;
      initialCount?: Maybe<Scalars['Int']>;
    };

    export type StreamDirectiveResolver<Result, Parent, ContextType = EZContext, Args = StreamDirectiveArgs> = DirectiveResolverFn<
      Result,
      Parent,
      ContextType,
      Args
    >;

    export type QueryResolvers<
      ContextType = EZContext,
      ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
    > = {
      hello?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
      users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
      stream?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
      context?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    };

    export type UserResolvers<
      ContextType = EZContext,
      ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User'],
    > = {
      id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
      __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
    };

    export type Resolvers<ContextType = EZContext> = {
      Query?: QueryResolvers<ContextType>;
      User?: UserResolvers<ContextType>;
    };

    export type DirectiveResolvers<ContextType = EZContext> = {
      defer?: DeferDirectiveResolver<any, any, ContextType>;
      stream?: StreamDirectiveResolver<any, any, ContextType>;
    };

    export type HelloQueryVariables = Exact<{ [key: string]: never }>;

    export type HelloQuery = { __typename?: 'Query'; hello: string };

    export const HelloDocument = {
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          operation: 'query',
          name: { kind: 'Name', value: 'hello' },
          selectionSet: { kind: 'SelectionSet', selections: [{ kind: 'Field', name: { kind: 'Name', value: 'hello' } }] },
        },
      ],
    } as unknown as DocumentNode<HelloQuery, HelloQueryVariables>;

    declare module 'graphql-ez' {
      interface EZResolvers extends Resolvers<import('graphql-ez').EZContext> {}
    }

    export type HelloWorld = 'Hello World!';
    "
  `);

  const introspectionJson = JSON.parse(
    await readFile(schemaJsonPath, {
      encoding: 'utf-8',
    })
  );

  expect(Object.keys(introspectionJson)).toStrictEqual(['__schema']);

  expect(printSchema(buildClientSchema(introspectionJson))).toMatchInlineSnapshot(`
    """"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    """
    directive @defer(
      """Deferred when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    """
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    """
    directive @stream(
      """Stream when true or undefined."""
      if: Boolean

      """Unique name"""
      label: String

      """Number of items to return immediately"""
      initialCount: Int = 0
    ) on FIELD

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }"
  `);

  expect(
    await readFile(schemaGqlPath, {
      encoding: 'utf-8',
    })
  ).toMatchInlineSnapshot(`
    "schema {
      query: Query
    }

    "Directs the executor to defer this fragment when the \`if\` argument is true or undefined."
    directive @defer(
      """
      Deferred when true or undefined.
      """
      if: Boolean
      """
      Unique name
      """
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    "Directs the executor to stream plural fields when the \`if\` argument is true or undefined."
    directive @stream(
      """
      Stream when true or undefined.
      """
      if: Boolean
      """
      Unique name
      """
      label: String
      """
      Number of items to return immediately
      """
      initialCount: Int = 0
    ) on FIELD

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }
    "
  `);
});
