import { outputFile, readFile } from 'fs-extra';
import { resolve } from 'path';
import tmp from 'tmp-promise';

import { CommonSchema, createDeferredPromise, LazyPromise, startFastifyServer, TearDownPromises } from 'graphql-ez-testing';

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
      stream: Array<Scalars['String']>;
      context: Scalars['String'];
    };

    export type User = {
      __typename?: 'User';
      id: Scalars['Int'];
    };

    export type ResolverTypeWrapper<T> = Promise<T> | T;

    export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
      fragment: string;
      resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
    };

    export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
      selectionSet: string;
      resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
    };
    export type StitchingResolver<TResult, TParent, TContext, TArgs> =
      | LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
      | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
    export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
      | ResolverFn<TResult, TParent, TContext, TArgs>
      | StitchingResolver<TResult, TParent, TContext, TArgs>;

    export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
      parent: TParent,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo
    ) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

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

    export type QueryResolvers<
      ContextType = EZContext,
      ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
    > = {
      hello?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
      users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
      stream?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
      context?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
    };

    export type UserResolvers<
      ContextType = EZContext,
      ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']
    > = {
      id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
      __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
    };

    export type Resolvers<ContextType = EZContext> = {
      Query?: QueryResolvers<ContextType>;
      User?: UserResolvers<ContextType>;
    };

    /**
     * @deprecated
     * Use \\"Resolvers\\" root object instead. If you wish to get \\"IResolvers\\", add \\"typesPrefix: I\\" to your config.
     */
    export type IResolvers<ContextType = EZContext> = Resolvers<ContextType>;

    export type HelloQueryVariables = Exact<{ [key: string]: never }>;

    export type HelloQuery = { __typename?: 'Query' } & Pick<Query, 'hello'>;

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
    "
  `);

  expect(
    JSON.parse(
      await readFile(schemaJsonPath, {
        encoding: 'utf-8',
      })
    )
  ).toMatchInlineSnapshot(`
    Object {
      "__schema": Object {
        "directives": Array [
          Object {
            "args": Array [
              Object {
                "defaultValue": null,
                "description": "Included when true.",
                "name": "if",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Boolean",
                    "ofType": null,
                  },
                },
              },
            ],
            "description": "Directs the executor to include this field or fragment only when the \`if\` argument is true.",
            "locations": Array [
              "FIELD",
              "FRAGMENT_SPREAD",
              "INLINE_FRAGMENT",
            ],
            "name": "include",
          },
          Object {
            "args": Array [
              Object {
                "defaultValue": null,
                "description": "Skipped when true.",
                "name": "if",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Boolean",
                    "ofType": null,
                  },
                },
              },
            ],
            "description": "Directs the executor to skip this field or fragment when the \`if\` argument is true.",
            "locations": Array [
              "FIELD",
              "FRAGMENT_SPREAD",
              "INLINE_FRAGMENT",
            ],
            "name": "skip",
          },
          Object {
            "args": Array [
              Object {
                "defaultValue": null,
                "description": "Deferred when true or undefined.",
                "name": "if",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "Boolean",
                  "ofType": null,
                },
              },
              Object {
                "defaultValue": null,
                "description": "Unique name",
                "name": "label",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
            ],
            "description": "Directs the executor to defer this fragment when the \`if\` argument is true or undefined.",
            "locations": Array [
              "FRAGMENT_SPREAD",
              "INLINE_FRAGMENT",
            ],
            "name": "defer",
          },
          Object {
            "args": Array [
              Object {
                "defaultValue": null,
                "description": "Stream when true or undefined.",
                "name": "if",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "Boolean",
                  "ofType": null,
                },
              },
              Object {
                "defaultValue": null,
                "description": "Unique name",
                "name": "label",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "defaultValue": null,
                "description": "Number of items to return immediately",
                "name": "initialCount",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Int",
                    "ofType": null,
                  },
                },
              },
            ],
            "description": "Directs the executor to stream plural fields when the \`if\` argument is true or undefined.",
            "locations": Array [
              "FIELD",
            ],
            "name": "stream",
          },
          Object {
            "args": Array [
              Object {
                "defaultValue": "\\"No longer supported\\"",
                "description": "Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).",
                "name": "reason",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
            ],
            "description": "Marks an element of a GraphQL schema as no longer supported.",
            "locations": Array [
              "FIELD_DEFINITION",
              "ARGUMENT_DEFINITION",
              "INPUT_FIELD_DEFINITION",
              "ENUM_VALUE",
            ],
            "name": "deprecated",
          },
          Object {
            "args": Array [
              Object {
                "defaultValue": null,
                "description": "The URL that specifies the behaviour of this scalar.",
                "name": "url",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null,
                  },
                },
              },
            ],
            "description": "Exposes a URL that specifies the behaviour of this scalar.",
            "locations": Array [
              "SCALAR",
            ],
            "name": "specifiedBy",
          },
        ],
        "mutationType": null,
        "queryType": Object {
          "name": "Query",
        },
        "subscriptionType": null,
        "types": Array [
          Object {
            "description": null,
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "hello",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "users",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "LIST",
                    "name": null,
                    "ofType": Object {
                      "kind": "NON_NULL",
                      "name": null,
                      "ofType": Object {
                        "kind": "OBJECT",
                        "name": "User",
                        "ofType": null,
                      },
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "stream",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "LIST",
                    "name": null,
                    "ofType": Object {
                      "kind": "NON_NULL",
                      "name": null,
                      "ofType": Object {
                        "kind": "SCALAR",
                        "name": "String",
                        "ofType": null,
                      },
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "context",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null,
                  },
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "Query",
            "possibleTypes": null,
          },
          Object {
            "description": "The \`String\` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.",
            "enumValues": null,
            "fields": null,
            "inputFields": null,
            "interfaces": null,
            "kind": "SCALAR",
            "name": "String",
            "possibleTypes": null,
          },
          Object {
            "description": null,
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "id",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Int",
                    "ofType": null,
                  },
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "User",
            "possibleTypes": null,
          },
          Object {
            "description": "The \`Int\` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.",
            "enumValues": null,
            "fields": null,
            "inputFields": null,
            "interfaces": null,
            "kind": "SCALAR",
            "name": "Int",
            "possibleTypes": null,
          },
          Object {
            "description": "The \`Boolean\` scalar type represents \`true\` or \`false\`.",
            "enumValues": null,
            "fields": null,
            "inputFields": null,
            "interfaces": null,
            "kind": "SCALAR",
            "name": "Boolean",
            "possibleTypes": null,
          },
          Object {
            "description": "A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.",
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "description",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": "A list of all types supported by this server.",
                "isDeprecated": false,
                "name": "types",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "LIST",
                    "name": null,
                    "ofType": Object {
                      "kind": "NON_NULL",
                      "name": null,
                      "ofType": Object {
                        "kind": "OBJECT",
                        "name": "__Type",
                        "ofType": null,
                      },
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": "The type that query operations will be rooted at.",
                "isDeprecated": false,
                "name": "queryType",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "OBJECT",
                    "name": "__Type",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": "If this server supports mutation, the type that mutation operations will be rooted at.",
                "isDeprecated": false,
                "name": "mutationType",
                "type": Object {
                  "kind": "OBJECT",
                  "name": "__Type",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": "If this server support subscription, the type that subscription operations will be rooted at.",
                "isDeprecated": false,
                "name": "subscriptionType",
                "type": Object {
                  "kind": "OBJECT",
                  "name": "__Type",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": "A list of all directives supported by this server.",
                "isDeprecated": false,
                "name": "directives",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "LIST",
                    "name": null,
                    "ofType": Object {
                      "kind": "NON_NULL",
                      "name": null,
                      "ofType": Object {
                        "kind": "OBJECT",
                        "name": "__Directive",
                        "ofType": null,
                      },
                    },
                  },
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "__Schema",
            "possibleTypes": null,
          },
          Object {
            "description": "The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the \`__TypeKind\` enum.

    Depending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional \`specifiedByUrl\`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.",
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "kind",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "ENUM",
                    "name": "__TypeKind",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "name",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "description",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "specifiedByUrl",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [
                  Object {
                    "defaultValue": "false",
                    "description": null,
                    "name": "includeDeprecated",
                    "type": Object {
                      "kind": "SCALAR",
                      "name": "Boolean",
                      "ofType": null,
                    },
                  },
                ],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "fields",
                "type": Object {
                  "kind": "LIST",
                  "name": null,
                  "ofType": Object {
                    "kind": "NON_NULL",
                    "name": null,
                    "ofType": Object {
                      "kind": "OBJECT",
                      "name": "__Field",
                      "ofType": null,
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "interfaces",
                "type": Object {
                  "kind": "LIST",
                  "name": null,
                  "ofType": Object {
                    "kind": "NON_NULL",
                    "name": null,
                    "ofType": Object {
                      "kind": "OBJECT",
                      "name": "__Type",
                      "ofType": null,
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "possibleTypes",
                "type": Object {
                  "kind": "LIST",
                  "name": null,
                  "ofType": Object {
                    "kind": "NON_NULL",
                    "name": null,
                    "ofType": Object {
                      "kind": "OBJECT",
                      "name": "__Type",
                      "ofType": null,
                    },
                  },
                },
              },
              Object {
                "args": Array [
                  Object {
                    "defaultValue": "false",
                    "description": null,
                    "name": "includeDeprecated",
                    "type": Object {
                      "kind": "SCALAR",
                      "name": "Boolean",
                      "ofType": null,
                    },
                  },
                ],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "enumValues",
                "type": Object {
                  "kind": "LIST",
                  "name": null,
                  "ofType": Object {
                    "kind": "NON_NULL",
                    "name": null,
                    "ofType": Object {
                      "kind": "OBJECT",
                      "name": "__EnumValue",
                      "ofType": null,
                    },
                  },
                },
              },
              Object {
                "args": Array [
                  Object {
                    "defaultValue": "false",
                    "description": null,
                    "name": "includeDeprecated",
                    "type": Object {
                      "kind": "SCALAR",
                      "name": "Boolean",
                      "ofType": null,
                    },
                  },
                ],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "inputFields",
                "type": Object {
                  "kind": "LIST",
                  "name": null,
                  "ofType": Object {
                    "kind": "NON_NULL",
                    "name": null,
                    "ofType": Object {
                      "kind": "OBJECT",
                      "name": "__InputValue",
                      "ofType": null,
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "ofType",
                "type": Object {
                  "kind": "OBJECT",
                  "name": "__Type",
                  "ofType": null,
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "__Type",
            "possibleTypes": null,
          },
          Object {
            "description": "An enum describing what kind of type a given \`__Type\` is.",
            "enumValues": Array [
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is a scalar.",
                "isDeprecated": false,
                "name": "SCALAR",
              },
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is an object. \`fields\` and \`interfaces\` are valid fields.",
                "isDeprecated": false,
                "name": "OBJECT",
              },
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is an interface. \`fields\`, \`interfaces\`, and \`possibleTypes\` are valid fields.",
                "isDeprecated": false,
                "name": "INTERFACE",
              },
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is a union. \`possibleTypes\` is a valid field.",
                "isDeprecated": false,
                "name": "UNION",
              },
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is an enum. \`enumValues\` is a valid field.",
                "isDeprecated": false,
                "name": "ENUM",
              },
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is an input object. \`inputFields\` is a valid field.",
                "isDeprecated": false,
                "name": "INPUT_OBJECT",
              },
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is a list. \`ofType\` is a valid field.",
                "isDeprecated": false,
                "name": "LIST",
              },
              Object {
                "deprecationReason": null,
                "description": "Indicates this type is a non-null. \`ofType\` is a valid field.",
                "isDeprecated": false,
                "name": "NON_NULL",
              },
            ],
            "fields": null,
            "inputFields": null,
            "interfaces": null,
            "kind": "ENUM",
            "name": "__TypeKind",
            "possibleTypes": null,
          },
          Object {
            "description": "Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.",
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "name",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "description",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [
                  Object {
                    "defaultValue": "false",
                    "description": null,
                    "name": "includeDeprecated",
                    "type": Object {
                      "kind": "SCALAR",
                      "name": "Boolean",
                      "ofType": null,
                    },
                  },
                ],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "args",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "LIST",
                    "name": null,
                    "ofType": Object {
                      "kind": "NON_NULL",
                      "name": null,
                      "ofType": Object {
                        "kind": "OBJECT",
                        "name": "__InputValue",
                        "ofType": null,
                      },
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "type",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "OBJECT",
                    "name": "__Type",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "isDeprecated",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Boolean",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "deprecationReason",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "__Field",
            "possibleTypes": null,
          },
          Object {
            "description": "Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.",
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "name",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "description",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "type",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "OBJECT",
                    "name": "__Type",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": "A GraphQL-formatted string representing the default value for this input value.",
                "isDeprecated": false,
                "name": "defaultValue",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "isDeprecated",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Boolean",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "deprecationReason",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "__InputValue",
            "possibleTypes": null,
          },
          Object {
            "description": "One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.",
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "name",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "description",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "isDeprecated",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Boolean",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "deprecationReason",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "__EnumValue",
            "possibleTypes": null,
          },
          Object {
            "description": "A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.

    In some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.",
            "enumValues": null,
            "fields": Array [
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "name",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "String",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "description",
                "type": Object {
                  "kind": "SCALAR",
                  "name": "String",
                  "ofType": null,
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "isRepeatable",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "SCALAR",
                    "name": "Boolean",
                    "ofType": null,
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "locations",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "LIST",
                    "name": null,
                    "ofType": Object {
                      "kind": "NON_NULL",
                      "name": null,
                      "ofType": Object {
                        "kind": "ENUM",
                        "name": "__DirectiveLocation",
                        "ofType": null,
                      },
                    },
                  },
                },
              },
              Object {
                "args": Array [],
                "deprecationReason": null,
                "description": null,
                "isDeprecated": false,
                "name": "args",
                "type": Object {
                  "kind": "NON_NULL",
                  "name": null,
                  "ofType": Object {
                    "kind": "LIST",
                    "name": null,
                    "ofType": Object {
                      "kind": "NON_NULL",
                      "name": null,
                      "ofType": Object {
                        "kind": "OBJECT",
                        "name": "__InputValue",
                        "ofType": null,
                      },
                    },
                  },
                },
              },
            ],
            "inputFields": null,
            "interfaces": Array [],
            "kind": "OBJECT",
            "name": "__Directive",
            "possibleTypes": null,
          },
          Object {
            "description": "A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.",
            "enumValues": Array [
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a query operation.",
                "isDeprecated": false,
                "name": "QUERY",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a mutation operation.",
                "isDeprecated": false,
                "name": "MUTATION",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a subscription operation.",
                "isDeprecated": false,
                "name": "SUBSCRIPTION",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a field.",
                "isDeprecated": false,
                "name": "FIELD",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a fragment definition.",
                "isDeprecated": false,
                "name": "FRAGMENT_DEFINITION",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a fragment spread.",
                "isDeprecated": false,
                "name": "FRAGMENT_SPREAD",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an inline fragment.",
                "isDeprecated": false,
                "name": "INLINE_FRAGMENT",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a variable definition.",
                "isDeprecated": false,
                "name": "VARIABLE_DEFINITION",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a schema definition.",
                "isDeprecated": false,
                "name": "SCHEMA",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a scalar definition.",
                "isDeprecated": false,
                "name": "SCALAR",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an object type definition.",
                "isDeprecated": false,
                "name": "OBJECT",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a field definition.",
                "isDeprecated": false,
                "name": "FIELD_DEFINITION",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an argument definition.",
                "isDeprecated": false,
                "name": "ARGUMENT_DEFINITION",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an interface definition.",
                "isDeprecated": false,
                "name": "INTERFACE",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to a union definition.",
                "isDeprecated": false,
                "name": "UNION",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an enum definition.",
                "isDeprecated": false,
                "name": "ENUM",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an enum value definition.",
                "isDeprecated": false,
                "name": "ENUM_VALUE",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an input object type definition.",
                "isDeprecated": false,
                "name": "INPUT_OBJECT",
              },
              Object {
                "deprecationReason": null,
                "description": "Location adjacent to an input object field definition.",
                "isDeprecated": false,
                "name": "INPUT_FIELD_DEFINITION",
              },
            ],
            "fields": null,
            "inputFields": null,
            "interfaces": null,
            "kind": "ENUM",
            "name": "__DirectiveLocation",
            "possibleTypes": null,
          },
        ],
      },
    }
  `);

  expect(
    await readFile(schemaGqlPath, {
      encoding: 'utf-8',
    })
  ).toMatchInlineSnapshot(`
    "schema {
      query: Query
    }

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]!
      context: String!
    }

    type User {
      id: Int!
    }
    "
  `);
});
