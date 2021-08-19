import { gql } from '@graphql-ez/utils/gql';
import { uniqueArray } from '@graphql-ez/utils/object';
import { resolvers as scalarResolvers, typeDefs as scalarTypeDefs } from 'graphql-scalars';

import type { EZPlugin } from 'graphql-ez';
import type { IScalarTypeResolver } from '@graphql-tools/utils';
import type { DocumentNode, GraphQLScalarType } from 'graphql';
export type ScalarsConfig = '*' | { [k in keyof typeof scalarResolvers]?: boolean | 1 | 0 } | Array<keyof typeof scalarResolvers>;

export type ScalarResolvers = Record<string, IScalarTypeResolver>;

declare module 'graphql-ez' {
  interface InternalAppBuildContext {
    scalarsDefinition?: ScalarsDefinition;
  }
}

export interface ScalarsDefinition {
  typeDefs: DocumentNode;
  resolvers: ScalarResolvers;
}

export const ezScalars = (scalars: ScalarsConfig, customScalars: Record<string, GraphQLScalarType> = {}): EZPlugin => {
  return {
    name: 'GraphQL Scalars',
    async onRegister(ctx) {
      if (scalars === '*') {
        getScalarsModule(scalarTypeDefs, scalarResolvers);
        return;
      }

      if (Array.isArray(scalars)) {
        const filteredScalarTypeDefs = scalars.reduce<string[]>((acum, scalarName) => {
          if (scalarName in scalarResolvers) acum.push(`scalar ${scalarName}`);
          return acum;
        }, []);

        if (!filteredScalarTypeDefs.length) return;

        const resolvers = scalars.reduce<ScalarResolvers>((acum, scalarName) => {
          const resolver = (scalarResolvers as ScalarResolvers)[scalarName];

          if (resolver) acum[scalarName] = resolver;
          return acum;
        }, {});

        getScalarsModule(filteredScalarTypeDefs, resolvers);
        return;
      }

      const scalarsEntries = Object.entries(scalars);
      const filteredScalarTypeDefs = scalarsEntries.reduce<string[]>((acum, [scalarName, value]) => {
        if (value && scalarName in scalarResolvers) acum.push(`scalar ${scalarName}`);
        return acum;
      }, []);

      if (!filteredScalarTypeDefs.length) return;

      const resolvers = scalarsEntries.reduce<ScalarResolvers>((acum, [scalarName, value]) => {
        const resolver = (scalarResolvers as ScalarResolvers)[scalarName];

        if (resolver && value) acum[scalarName] = resolver;
        return acum;
      }, {});

      getScalarsModule(filteredScalarTypeDefs, resolvers);

      function getScalarsModule(filteredScalarTypeDefs: string[], filteredResolvers: ScalarResolvers): ScalarsDefinition {
        const customScalarsEntries = Object.entries(customScalars);

        const typeDefs = gql(
          uniqueArray([...filteredScalarTypeDefs, ...customScalarsEntries.map(([name]) => `scalar ${name}`)]).join('\n')
        );

        const resolvers: ScalarResolvers = {
          ...filteredResolvers,
          ...customScalarsEntries.reduce<Record<string, GraphQLScalarType>>((acum, [name, resolver]) => {
            acum[name] = resolver;
            return acum;
          }, {}),
        };

        (ctx.extraSchemaDefinitions ||= []).push({
          id: 'Scalars',
          typeDefs,
          resolvers,
        });

        ctx.scalarsDefinition = {
          typeDefs,
          resolvers,
        };

        return {
          typeDefs,
          resolvers,
        };
      }
    },
    onPreBuild(ctx) {
      if (!ctx.schemaPlugin && !ctx.modulesEnvelopPlugin) {
        console.warn(
          `[@graphql-ez/plugin-scalars] No "@graphql-ez/plugin-schema" or "@graphql-ez/plugin-modules" found! GraphQL Scalar resolvers couldn't be added!`
        );
      }
    },
  };
};
