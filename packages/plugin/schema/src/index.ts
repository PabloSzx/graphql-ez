import { cleanObject, toPlural } from '@graphql-ez/utils/object';
import type * as GraphQLToolSchema from '@graphql-tools/schema';
import type { IExecutableSchemaDefinition, MergeSchemasConfig } from '@graphql-tools/schema';
import type { IResolvers, TypeSource } from '@graphql-tools/utils';
import { DocumentNode, GraphQLSchema, isSchema } from 'graphql';
import { EZContext, EZPlugin, EZResolvers, LazyPromise, useSchema } from 'graphql-ez';

export interface EZExecutableSchemaDefinition<TContext = EZContext>
  extends Omit<IExecutableSchemaDefinition<TContext>, 'resolvers'> {
  resolvers?: EZResolvers | EZResolvers[];
}

export type EZSchema<TContext = EZContext> =
  | GraphQLSchema
  | Promise<GraphQLSchema>
  | EZExecutableSchemaDefinition<TContext>
  | Promise<EZExecutableSchemaDefinition<TContext>>;

export type FilteredMergeSchemasConfig = Omit<MergeSchemasConfig, 'schemas'>;

export interface EZSchemaOptions {
  /**
   * Pre-built or to-build schemas
   */
  schema?: EZSchema<EZContext> | EZSchema<EZContext>[];

  /**
   * Customize configuration of schema merging
   */
  mergeSchemasConfig?: FilteredMergeSchemasConfig;

  /**
   * Customize configuration of executable schema definition
   */
  executableSchemaConfig?: Partial<EZExecutableSchemaDefinition>;

  /**
   * Transform the final schema obtained
   */
  transformFinalSchema?: (schema: GraphQLSchema) => GraphQLSchema | Promise<GraphQLSchema>;
}

export interface RegisterTypeDefs {
  <TypeDefs extends [TypeSource, ...Array<TypeSource>]>(...typeDefs: TypeDefs): TypeDefs;
}

/**
 * @comment Explicit function overload workaround until https://github.com/microsoft/TypeScript/issues/45617 is fixed
 */
export interface RegisterResolvers {
  <Resolvers extends EZResolvers>(resolvers: Resolvers): [Resolvers];
  <Resolvers extends EZResolvers, Resolvers2 extends EZResolvers>(resolvers: Resolvers, resolvers2: Resolvers2): [
    Resolvers,
    Resolvers2
  ];
  <Resolvers extends EZResolvers, Resolvers2 extends EZResolvers, Resolvers3 extends EZResolvers>(
    resolvers: Resolvers,
    resolvers2: Resolvers2,
    resolvers3: Resolvers3
  ): [Resolvers, Resolvers2, Resolvers3];
  <Resolvers extends EZResolvers, Resolvers2 extends EZResolvers, Resolvers3 extends EZResolvers, Resolvers4 extends EZResolvers>(
    resolvers: Resolvers,
    resolvers2: Resolvers2,
    resolvers3: Resolvers3,
    resolvers4: Resolvers4
  ): [Resolvers, Resolvers2, Resolvers3, Resolvers4];
  <
    Resolvers extends EZResolvers,
    Resolvers2 extends EZResolvers,
    Resolvers3 extends EZResolvers,
    Resolvers4 extends EZResolvers,
    Resolvers5 extends EZResolvers
  >(
    resolvers: Resolvers,
    resolvers2: Resolvers2,
    resolvers3: Resolvers3,
    resolvers4: Resolvers4,
    resolvers5: Resolvers5
  ): [Resolvers, Resolvers2, Resolvers3, Resolvers4, Resolvers5];
  <Resolvers extends [EZResolvers, ...Array<EZResolvers>]>(...resolvers: Resolvers): Resolvers;
}

/**
 * @comment Explicit function overload workaround until https://github.com/microsoft/TypeScript/issues/45617 is fixed
 */
export interface RegisterSchemas {
  <Schemas extends EZSchema>(schemas: Schemas): [Schemas];
  <Schemas extends EZSchema, Schemas2 extends EZSchema>(schemas: Schemas, schemas2: Schemas2): [Schemas, Schemas2];
  <Schemas extends EZSchema, Schemas2 extends EZSchema, Schemas3 extends EZSchema>(
    schemas: Schemas,
    schemas2: Schemas2,
    schemas3: Schemas3
  ): [Schemas, Schemas2, Schemas3];
  <Schemas extends EZSchema, Schemas2 extends EZSchema, Schemas3 extends EZSchema, Schemas4 extends EZSchema>(
    schemas: Schemas,
    schemas2: Schemas2,
    schemas3: Schemas3,
    schemas4: Schemas4
  ): [Schemas, Schemas2, Schemas3, Schemas4];
  <
    Schemas extends EZSchema,
    Schemas2 extends EZSchema,
    Schemas3 extends EZSchema,
    Schemas4 extends EZSchema,
    Schemas5 extends EZSchema
  >(
    schemas: Schemas,
    schemas2: Schemas2,
    schemas3: Schemas3,
    schemas4: Schemas4,
    schemas5: Schemas5
  ): [Schemas, Schemas2, Schemas3, Schemas4, Schemas5];
  <Schemas extends [EZSchema, ...Array<EZSchema>]>(...schemas: Schemas): Schemas;
}

declare module 'graphql-ez' {
  interface ExtraSchemaDef {
    id: string;
    typeDefs: DocumentNode | string | Array<DocumentNode | string>;
    resolvers: EZResolvers | EZResolvers[];
  }

  interface InternalAppBuildContext {
    schemaPlugin?: {
      options: EZSchemaOptions;
      toolsSchema: Promise<typeof GraphQLToolSchema>;
    };

    extraSchemaDefinitions?: (ExtraSchemaDef | Promise<ExtraSchemaDef>)[];

    registeredTypeDefs?: TypeSource[];
    registeredResolvers?: EZResolvers[];
    registeredSchemas?: EZSchema[];
  }

  interface EZResolvers extends IResolvers<any, EZContext> {}

  interface BaseAppBuilder {
    registerTypeDefs: RegisterTypeDefs;

    registerResolvers: RegisterResolvers;

    registerSchema: RegisterSchemas;
  }
}

export { gql } from 'graphql-ez';

export const ezSchema = (options: EZSchemaOptions = {}): EZPlugin => {
  const toolsSchemaPrimise = LazyPromise(() => import('@graphql-tools/schema'));

  const schemaPlugin = { options: { ...options }, toolsSchema: toolsSchemaPrimise };
  return {
    name: 'EZ Schema',
    onRegister(ctx) {
      ctx.schemaPlugin = schemaPlugin;

      ctx.appBuilder.registerTypeDefs = registerTypeDefs;

      function registerTypeDefs<TypeDefs extends [TypeSource, ...Array<TypeSource>]>(...typeDefs: TypeDefs): TypeDefs {
        for (const typeDef of typeDefs) {
          (ctx.registeredTypeDefs ||= []).push(typeDef);
        }

        return typeDefs;
      }

      ctx.appBuilder.registerResolvers = registerResolvers;

      function registerResolvers<Resolvers extends [EZResolvers, ...Array<EZResolvers>]>(...ezResolvers: Resolvers): Resolvers {
        for (const resolvers of ezResolvers) {
          (ctx.registeredResolvers ||= []).push(resolvers);
        }

        return ezResolvers;
      }

      function registerSchema<Schemas extends [EZSchema, ...Array<EZSchema>]>(...schemas: Schemas): Schemas {
        (ctx.registeredSchemas ||= []).push(...schemas);

        return schemas;
      }

      ctx.appBuilder.registerSchema = registerSchema;
    },
    async onPreBuild(ctx) {
      const options = schemaPlugin.options;
      const extraSchemaDefs = ctx.extraSchemaDefinitions ? await Promise.all(ctx.extraSchemaDefinitions) : [];

      const extraTypeDefs = [...extraSchemaDefs.flatMap(v => v.typeDefs), ...toPlural(options.mergeSchemasConfig?.typeDefs)];
      const extraResolvers: EZResolvers[] = [
        ...extraSchemaDefs.flatMap<EZResolvers>(v => v.resolvers),
        ...toPlural(options.mergeSchemasConfig?.resolvers),
      ];

      const schemaList = [
        ...(ctx.registeredSchemas || []),
        ...(ctx.options.schema && ctx.options.schema !== 'dynamic'
          ? [ctx.options.schema, ...toPlural(options.schema)]
          : toPlural(options.schema)),
      ];

      const registeredResolvers = ctx.registeredResolvers;
      const registeredTypeDefs = ctx.registeredTypeDefs;

      if (registeredTypeDefs || options.executableSchemaConfig?.typeDefs) {
        const typeDefs = [...(registeredTypeDefs || []), ...toPlural(options.executableSchemaConfig?.typeDefs)];
        const resolvers = [...(registeredResolvers || []), ...toPlural(options.executableSchemaConfig?.resolvers)];

        schemaList.push({
          ...options.executableSchemaConfig,
          typeDefs,
          resolvers,
        });
      } else if (schemaList.length && registeredResolvers?.length) {
        extraResolvers.push(...registeredResolvers);
      } else if (registeredResolvers?.length) {
        throw Error(
          `[graphql-ez] To use 'registerResolvers' you need to specify at least one type definition or external schema`
        );
      }

      const typeDefsToMerge = extraTypeDefs.length ? extraTypeDefs : undefined;
      const resolversToMerge = extraResolvers.length ? extraResolvers : undefined;

      const schemas = schemaList.length
        ? await Promise.all(
            toPlural(schemaList).map(async schemaValuePromise => {
              const schemaValue = await schemaValuePromise;
              if (isSchema(schemaValue)) {
                if (!typeDefsToMerge && !resolversToMerge) return schemaValue;

                return (await toolsSchemaPrimise).mergeSchemas({
                  schemas: [schemaValue],
                  typeDefs: typeDefsToMerge,
                  resolvers: resolversToMerge,
                });
              }

              return (await toolsSchemaPrimise).makeExecutableSchema({
                ...schemaValue,
                typeDefs: [...toPlural(schemaValue.typeDefs), ...extraTypeDefs],
                resolvers: [...toPlural(schemaValue.resolvers), ...extraResolvers],
              });
            })
          )
        : [];

      let finalSchema: GraphQLSchema | undefined;

      const modulesSchemaList = ctx.modules?.length && ctx.modulesApplication ? [(await ctx.modulesApplication).schema] : [];

      if (schemas.length > 1) {
        finalSchema = (await toolsSchemaPrimise).mergeSchemas({
          ...cleanObject(options.mergeSchemasConfig),
          schemas: [...modulesSchemaList, ...schemas],
        });
      } else if (schemas[0]) {
        finalSchema = modulesSchemaList[0]
          ? (await toolsSchemaPrimise).mergeSchemas({
              ...cleanObject(options.mergeSchemasConfig),
              schemas: [...modulesSchemaList, schemas[0]],
            })
          : schemas[0];
      }

      if (ctx.modulesEnvelopPlugin) {
        ctx.options.envelop.plugins.push(await ctx.modulesEnvelopPlugin);
      }

      if (finalSchema) {
        if (options.transformFinalSchema) {
          finalSchema = await options.transformFinalSchema(finalSchema);
        }
        ctx.options.envelop.plugins.push(useSchema(finalSchema));
      }
    },
  };
};
