import { gql } from '@graphql-ez/core-utils/gql';

import type { EZPlugin } from '@graphql-ez/core-types';
import type { resolvers as scalarResolvers } from 'graphql-scalars';
import type { IScalarTypeResolver } from '@graphql-tools/utils';
import type { DocumentNode } from 'graphql';

export type ScalarsConfig = '*' | { [k in keyof typeof scalarResolvers]?: boolean | 1 | 0 } | Array<keyof typeof scalarResolvers>;

export type ScalarResolvers = Record<string, IScalarTypeResolver>;

declare module '@graphql-ez/core-types' {
  interface InternalAppBuildContext {
    scalarsDefinition?: Promise<ScalarsDefinition>;
  }
}

export interface ScalarsDefinition {
  typeDefs: DocumentNode;
  resolvers: ScalarResolvers;
}

export const ScalarsEZPlugin = (scalars?: ScalarsConfig): EZPlugin => {
  return {
    async onRegister(ctx) {
      if (!scalars) return;

      const { typeDefs: scalarTypeDefs, resolvers: scalarResolvers } = await import('graphql-scalars');

      if (scalars === '*') {
        ctx.scalarsDefinition = getScalarsModule(scalarTypeDefs, scalarResolvers);
        return;
      }

      if (Array.isArray(scalars)) {
        const scalarsNames = scalars.reduce((acum, scalarName) => {
          if (scalarName in scalarResolvers) acum.push(`scalar ${scalarName}`);
          return acum;
        }, [] as string[]);

        if (!scalarsNames.length) return;

        const resolvers = scalars.reduce((acum, scalarName) => {
          const resolver = (scalarResolvers as ScalarResolvers)[scalarName];

          if (resolver) acum[scalarName] = resolver;
          return acum;
        }, {} as ScalarResolvers);

        ctx.scalarsDefinition = getScalarsModule(scalarsNames, resolvers);
        return;
      }

      const scalarsNames = Object.entries(scalars).reduce((acum, [scalarName, value]) => {
        if (value && scalarName in scalarResolvers) acum.push(`scalar ${scalarName}`);
        return acum;
      }, [] as string[]);

      if (!scalarsNames.length) return;

      const resolvers = Object.keys(scalars).reduce((acum, scalarName) => {
        const resolver = (scalarResolvers as ScalarResolvers)[scalarName];

        if (resolver) acum[scalarName] = resolver;
        return acum;
      }, {} as ScalarResolvers);

      ctx.scalarsDefinition = getScalarsModule(scalarsNames, resolvers);

      async function getScalarsModule(scalarsNames: string[], resolvers: ScalarResolvers): Promise<ScalarsDefinition> {
        const typeDefs = gql(scalarsNames.join('\n'));

        return {
          typeDefs,
          resolvers,
        };
      }
    },
  };
};
