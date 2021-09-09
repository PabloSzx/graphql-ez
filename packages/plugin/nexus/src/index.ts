import type { EZPlugin } from 'graphql-ez';
import { useSchema } from 'graphql-ez';
import {
  asNexusMethod,
  enumType,
  extendInputType,
  extendType,
  inputObjectType,
  interfaceType,
  makeSchema,
  mutationField,
  mutationType,
  objectType,
  queryField,
  queryType,
  scalarType,
  subscriptionField,
  subscriptionType,
  unionType,
} from 'nexus';
import type { SchemaConfig } from 'nexus/dist/builder';

export interface EZNexusOptions extends Omit<SchemaConfig, 'types'> {}

export interface RegisterNexus {
  readonly objectType: typeof objectType;
  readonly queryType: typeof queryType;
  readonly mutationType: typeof mutationType;
  readonly subscriptionType: typeof subscriptionType;
  readonly unionType: typeof unionType;
  readonly scalarType: typeof scalarType;
  readonly interfaceType: typeof interfaceType;
  readonly enumType: typeof enumType;
  readonly inputObjectType: typeof inputObjectType;
  readonly extendType: typeof extendType;
  readonly extendInputType: typeof extendInputType;
  readonly queryField: typeof queryField;
  readonly mutationField: typeof mutationField;
  readonly subscriptionField: typeof subscriptionField;
  readonly asNexusMethod: typeof asNexusMethod;
  readonly addType: (...v: unknown[]) => void;
}

declare module 'graphql-ez' {
  interface BaseAppBuilder {
    registerNexus: RegisterNexus;
  }

  interface InternalAppBuildContext {
    nexus?: {
      registerNexus: RegisterNexus;
      options: EZNexusOptions;
      types: unknown[];
    };
  }
}

export const ezNexus = (options: EZNexusOptions = {}): EZPlugin => {
  return {
    name: 'EZ Nexus',
    onRegister(ctx) {
      const types: unknown[] = [];

      const patchTypeCreator = <T extends Function>(fn: T): T => {
        const patched = (...args: any[]) => {
          const returned = fn(...args);

          types.push(returned);

          return returned;
        };

        return patched as unknown as T;
      };

      const registerNexus: RegisterNexus = {
        objectType: patchTypeCreator(objectType),
        mutationType: patchTypeCreator(mutationType),
        queryType: patchTypeCreator(queryType),
        subscriptionType: patchTypeCreator(subscriptionType),
        unionType: patchTypeCreator(unionType),
        scalarType: patchTypeCreator(scalarType),
        interfaceType: patchTypeCreator(interfaceType),
        enumType: patchTypeCreator(enumType),
        inputObjectType: patchTypeCreator(inputObjectType),
        extendType: patchTypeCreator(extendType),
        extendInputType: patchTypeCreator(extendInputType),
        queryField: patchTypeCreator(queryField),
        mutationField: patchTypeCreator(mutationField),
        subscriptionField: patchTypeCreator(subscriptionField),
        asNexusMethod: patchTypeCreator(asNexusMethod),
        addType(...typesList) {
          types.push(...typesList);
        },
      };

      ctx.appBuilder.registerNexus = registerNexus;

      ctx.nexus = {
        options,
        registerNexus,
        types,
      };
    },
    onPreBuild(ctx) {
      if (!ctx.nexus) return;

      const { types, options } = ctx.nexus;
      ctx.options.envelop.plugins.push(
        useSchema(
          makeSchema({
            ...options,
            types,
          })
        )
      );
    },
  };
};
