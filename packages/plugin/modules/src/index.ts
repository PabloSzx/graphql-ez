import { LazyPromise } from '@graphql-ez/core-utils/promise';
import { gql } from '@graphql-ez/core-utils/gql';
import { isDocumentNode } from '@graphql-tools/utils';

import type { EnvelopResolvers, EZPlugin } from '@graphql-ez/core-types';

import type { ModuleConfig, Module, TypeDefs } from 'graphql-modules';

export type EnvelopModuleConfig = Omit<ModuleConfig, 'typeDefs' | 'id' | 'resolvers'> & {
  id?: string;
  resolvers?: EnvelopResolvers;
  /**
   * Automatically add the created module in the built envelop app
   *
   * @default true
   */
  autoAdd?: boolean;
};

declare module '@graphql-ez/core-types' {
  interface BaseAppBuilder {
    registerModule: RegisterModule;
  }

  interface InternalAppBuildContext {
    modules: (Module | Promise<Module>)[];
  }
}

const GraphQLModules = LazyPromise(async () => {
  const { createModule } = await import('graphql-modules');

  return { createModule };
});

export interface RegisterModule {
  (module: Module): Module;
  (typeDefs: TypeDefs, options?: EnvelopModuleConfig): Promise<Module>;
}

export const EZGraphQLModulesPlugin = (): EZPlugin => {
  const registerModuleState = {
    acumId: 0,
  };

  return {
    onRegister(ctx) {
      ctx.modules = [];

      function registerModule(typeDefs: TypeDefs, config?: EnvelopModuleConfig): Promise<Module>;
      function registerModule(module: Module): Module;
      function registerModule(firstParam: TypeDefs | Module, options?: EnvelopModuleConfig) {
        if (Array.isArray(firstParam) || isDocumentNode(firstParam)) {
          const { id = `module${++registerModuleState.acumId}`, autoAdd = true } = options || {};

          const promiseModule = GraphQLModules.then(({ createModule }) => {
            return createModule({
              typeDefs: firstParam,
              id,
              ...options,
            });
          });

          if (autoAdd) ctx.modules.push(promiseModule);

          return promiseModule;
        }

        ctx.modules.push(firstParam);
        return firstParam;
      }

      ctx.appBuilder.registerModule = registerModule;
    },
  };
};

export { gql };
