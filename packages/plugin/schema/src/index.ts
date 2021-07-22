import { DocumentNode, GraphQLSchema, isSchema } from 'graphql';
import { EZContext, EZPlugin, EZResolvers, LazyPromise, useSchema } from 'graphql-ez';
import { cleanObject, toPlural } from 'graphql-ez/utils/object';

import type { IResolvers } from '@graphql-tools/utils';
import type { IExecutableSchemaDefinition } from '@graphql-tools/schema';
import type { MergeSchemasConfig } from '@graphql-tools/merge';

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
   * Pre-built schemas
   */
  schema?: EZSchema<EZContext> | EZSchema<EZContext>[];

  /**
   * Configure configuration of schema merging
   */
  mergeSchemasConfig?: FilteredMergeSchemasConfig;
}

declare module 'graphql-ez' {
  interface ExtraSchemaDef {
    id: string;
    typeDefs: DocumentNode | string | Array<DocumentNode | string>;
    resolvers: EZResolvers | EZResolvers[];
  }

  interface InternalAppBuildContext {
    schemaPlugin?: boolean;

    extraSchemaDefinitions?: (ExtraSchemaDef | Promise<ExtraSchemaDef>)[];
  }

  interface EZResolvers extends IResolvers<any, EZContext> {}
}

export { gql } from 'graphql-ez';

export const ezSchema = (options: EZSchemaOptions = {}): EZPlugin => {
  const mergeSchemas = LazyPromise(() => import('@graphql-tools/merge').then(v => v.mergeSchemasAsync));

  const makeExecutableSchema = LazyPromise(() => import('@graphql-tools/schema').then(v => v.makeExecutableSchema));

  const { schema, mergeSchemasConfig } = options;

  return {
    name: 'EZ Schema',
    onRegister(ctx) {
      ctx.schemaPlugin = true;
    },
    async onPreBuild(ctx) {
      const extraSchemaDefs = ctx.extraSchemaDefinitions ? await Promise.all(ctx.extraSchemaDefinitions) : [];

      const extraTypeDefs = [...extraSchemaDefs.flatMap(v => v.typeDefs), ...toPlural(mergeSchemasConfig?.typeDefs)];
      const extraResolvers: EZResolvers[] = [
        ...extraSchemaDefs.flatMap<EZResolvers>(v => v.resolvers),
        ...toPlural(mergeSchemasConfig?.resolvers),
      ];

      const typeDefs = extraTypeDefs.length ? extraTypeDefs : undefined;
      const resolvers = extraResolvers.length ? extraResolvers : undefined;

      const schemaList =
        ctx.options.schema && ctx.options.schema !== 'dynamic' ? [ctx.options.schema, ...toPlural(schema)] : toPlural(schema);

      const schemas = schemaList.length
        ? await Promise.all(
            toPlural(schemaList).map(async schemaValuePromise => {
              const schemaValue = await schemaValuePromise;
              if (isSchema(schemaValue)) {
                if (!typeDefs && !resolvers) return schemaValue;

                return (await mergeSchemas)({
                  schemas: [schemaValue],
                  typeDefs,
                  resolvers,
                });
              }

              return (await makeExecutableSchema)({
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
