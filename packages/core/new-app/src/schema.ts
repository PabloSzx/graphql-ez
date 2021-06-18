import { GraphQLSchema, isSchema } from 'graphql';

import { useSchema } from '@envelop/core';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { cleanObject, toPlural } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import type { IExecutableSchemaDefinition } from '@graphql-tools/schema';
import type { MergeSchemasConfig } from '@graphql-tools/merge';
import type { EnvelopContext, EnvelopResolvers, EZPlugin } from '@graphql-ez/core-types';

export type FilteredMergeSchemasConfig = Omit<MergeSchemasConfig, 'schemas'>;

export interface EZExecutableSchemaDefinition<TContext = EnvelopContext>
  extends Omit<IExecutableSchemaDefinition<TContext>, 'resolvers'> {
  resolvers?: EnvelopResolvers | EnvelopResolvers[];
}

export type EZSchemaDefinition<TContext = EnvelopContext> =
  | GraphQLSchema
  | Promise<GraphQLSchema>
  | EZExecutableSchemaDefinition<TContext>
  | Promise<EZExecutableSchemaDefinition<TContext>>;

export interface SchemaBuilderFactoryOptions {
  mergeSchemasConfig?: FilteredMergeSchemasConfig;
}

export interface PrepareSchemaOptions {
  schema: EZSchemaDefinition<never> | EZSchemaDefinition<never>[];
}

declare module '@graphql-ez/core-types' {
  interface AppOptions {
    /**
     * Pre-built schemas
     */
    schema?: EZSchemaDefinition<EnvelopContext> | EZSchemaDefinition<EnvelopContext>[];

    /**
     * Configure configuration of schema merging
     */
    mergeSchemasConfig?: FilteredMergeSchemasConfig;
  }
}

const Merge = LazyPromise(() => {
  return import('@graphql-tools/merge');
});

export const EZSchemaPlugin = (): EZPlugin => {
  return {
    async onPreBuild(ctx) {
      const { schema, mergeSchemasConfig } = ctx.options;

      const scalarsDefinition = await ctx.scalarsDefinition;

      const scalarsModuleSchema =
        scalarsDefinition &&
        LazyPromise(() => {
          return makeExecutableSchema({
            typeDefs: scalarsDefinition.typeDefs,
            resolvers: scalarsDefinition.resolvers,
          });
        });

      const schemas = schema
        ? await Promise.all(
            toPlural(schema).map(async schemaValuePromise => {
              const schemaValue = await schemaValuePromise;
              if (isSchema(schemaValue)) {
                if (!scalarsModuleSchema) return schemaValue;

                return (await Merge).mergeSchemasAsync({
                  ...cleanObject(mergeSchemasConfig),
                  schemas: [await scalarsModuleSchema, schemaValue],
                });
              }

              return makeExecutableSchema({
                ...schemaValue,
                typeDefs: scalarsDefinition
                  ? [...toPlural(schemaValue.typeDefs), scalarsDefinition.typeDefs]
                  : schemaValue.typeDefs,
                resolvers: scalarsDefinition
                  ? [...toPlural(schemaValue.resolvers || []), scalarsDefinition.resolvers]
                  : schemaValue.resolvers,
              });
            })
          )
        : [];

      let finalSchema: GraphQLSchema | undefined;

      const modulesSchemaList = ctx.modules?.length && ctx.modulesApplication ? [(await ctx.modulesApplication).schema] : [];

      if (schemas.length > 1) {
        finalSchema = await (
          await Merge
        ).mergeSchemasAsync({
          ...cleanObject(mergeSchemasConfig),
          schemas: [...modulesSchemaList, ...schemas],
        });
      } else if (schemas[0]) {
        finalSchema = modulesSchemaList[0]
          ? await (
              await Merge
            ).mergeSchemasAsync({
              ...cleanObject(mergeSchemasConfig),
              schemas: [...modulesSchemaList, schemas[0]],
            })
          : schemas[0];
      } else if (!ctx.modulesEnvelopPlugin) {
        throw Error('No GraphQL Schema specified!');
      }

      if (ctx.modulesEnvelopPlugin) {
        (ctx.options.envelop.plugins ||= []).push(await ctx.modulesEnvelopPlugin);
      }

      if (finalSchema) {
        (ctx.options.envelop.plugins ||= []).push(useSchema(finalSchema));
      }
    },
  };
};
