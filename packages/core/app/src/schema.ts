import { GraphQLSchema, isSchema, DocumentNode } from 'graphql';

import { useSchema } from '@envelop/core';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { cleanObject, toPlural } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import type { IResolvers } from '@graphql-tools/utils';
import type { IExecutableSchemaDefinition } from '@graphql-tools/schema';
import type { MergeSchemasConfig } from '@graphql-tools/merge';
import type { EZContext, EZResolvers, EZPlugin } from '@graphql-ez/core-types';

export type FilteredMergeSchemasConfig = Omit<MergeSchemasConfig, 'schemas'>;

export interface EZExecutableSchemaDefinition<TContext = EZContext>
  extends Omit<IExecutableSchemaDefinition<TContext>, 'resolvers'> {
  resolvers?: EZResolvers | EZResolvers[];
}

export type EZSchema<TContext = EZContext> =
  | GraphQLSchema
  | Promise<GraphQLSchema>
  | EZExecutableSchemaDefinition<TContext>
  | Promise<EZExecutableSchemaDefinition<TContext>>;

declare module '@graphql-ez/core-types' {
  interface AppOptions {
    /**
     * Pre-built schemas
     */
    schema?: EZSchema<EZContext> | EZSchema<EZContext>[];

    /**
     * Configure configuration of schema merging
     */
    mergeSchemasConfig?: FilteredMergeSchemasConfig;
  }

  interface ExtraSchemaDef {
    id: string;
    typeDefs: DocumentNode | string | Array<DocumentNode | string>;
    resolvers: EZResolvers | EZResolvers[];
  }

  interface InternalAppBuildContext {
    extraSchemaDefinitions?: (ExtraSchemaDef | Promise<ExtraSchemaDef>)[];
  }

  interface EZResolvers extends IResolvers<any, EZContext> {}
}

const mergeSchemas = LazyPromise(() => import('@graphql-tools/merge').then(v => v.mergeSchemasAsync));

export const ezSchema = (): EZPlugin => {
  return {
    name: 'GraphQL Schema',
    async onPreBuild(ctx) {
      const { schema, mergeSchemasConfig } = ctx.options;

      const extraSchemaDefs = ctx.extraSchemaDefinitions ? await Promise.all(ctx.extraSchemaDefinitions) : [];

      const extraTypeDefs = [...extraSchemaDefs.flatMap(v => v.typeDefs), ...toPlural(mergeSchemasConfig?.typeDefs)];
      const extraResolvers: EZResolvers[] = [
        ...extraSchemaDefs.flatMap<EZResolvers>(v => v.resolvers),
        ...toPlural(mergeSchemasConfig?.resolvers),
      ];

      const typeDefs = extraTypeDefs.length ? extraTypeDefs : undefined;
      const resolvers = extraResolvers.length ? extraResolvers : undefined;

      const schemas = schema
        ? await Promise.all(
            toPlural(schema).map(async schemaValuePromise => {
              const schemaValue = await schemaValuePromise;
              if (isSchema(schemaValue)) {
                return (await mergeSchemas)({
                  schemas: [schemaValue],
                  typeDefs,
                  resolvers,
                });
              }

              return makeExecutableSchema({
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
        finalSchema = await (
          await mergeSchemas
        )({
          ...cleanObject(mergeSchemasConfig),
          schemas: [...modulesSchemaList, ...schemas],
        });
      } else if (schemas[0]) {
        finalSchema = modulesSchemaList[0]
          ? await (
              await mergeSchemas
            )({
              ...cleanObject(mergeSchemasConfig),
              schemas: [...modulesSchemaList, schemas[0]],
            })
          : schemas[0];
      } else if (!ctx.modulesEnvelopPlugin) {
        throw Error('No GraphQL Schema specified!');
      }

      if (ctx.modulesEnvelopPlugin) {
        ctx.options.envelop.plugins.push(await ctx.modulesEnvelopPlugin);
      }

      if (finalSchema) {
        if (ctx.extraSchemaDefinitions) {
          finalSchema = await (
            await mergeSchemas
          )({
            schemas: [finalSchema],
            typeDefs,
            resolvers,
          });
        }

        ctx.options.envelop.plugins.push(useSchema(finalSchema));
      }
    },
  };
};

export { makeExecutableSchema };
