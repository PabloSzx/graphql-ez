import { useGraphQLModules } from '@envelop/graphql-modules';
import { gql } from '@graphql-ez/core-utils/gql';
import { LazyPromise } from '@graphql-ez/core-utils/promise';
import { isDocumentNode } from '@graphql-tools/utils';

import type { Plugin as EnvelopPlugin } from '@envelop/types';
import type { EnvelopResolvers, EZPlugin } from '@graphql-ez/core-types';
import type { ModuleConfig, Module, TypeDefs, Application, ApplicationConfig } from 'graphql-modules';

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
    modules?: (Module | Promise<Module>)[];
    modulesApplication?: Promise<Application>;
    modulesEnvelopPlugin?: Promise<EnvelopPlugin>;
  }
}

const GraphQLModules = LazyPromise(async () => {
  const { createModule, createApplication } = await import('graphql-modules');

  return { createModule, createApplication };
});

export interface RegisterModule {
  (module: Module): Module;
  (typeDefs: TypeDefs, options?: EnvelopModuleConfig): Promise<Module>;
}

export const GraphQLModulesEZPlugin = (config: Partial<Omit<ApplicationConfig, 'modules'>> = {}): EZPlugin => {
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

          if (autoAdd) (ctx.modules ||= []).push(promiseModule);

          return promiseModule;
        }

        (ctx.modules ||= []).push(firstParam);
        return firstParam;
      }

      ctx.appBuilder.registerModule = registerModule;

      const modulesApplication = (ctx.modulesApplication = LazyPromise(async () => {
        const { createApplication, createModule } = await GraphQLModules;

        const [scalarsModule, modules] = await Promise.all([
          ctx.scalarsDefinition
            ? ctx.scalarsDefinition.then(scalarsDef => {
                return createModule({
                  id: 'ScalarsModule',
                  dirname: 'ScalarsPlugin',
                  ...scalarsDef,
                });
              })
            : null,
          Promise.all(ctx.modules || []),
        ]);
        return createApplication({
          modules: scalarsModule ? [scalarsModule, ...modules] : modules,
          ...config,
        });
      }));

      ctx.modulesEnvelopPlugin = LazyPromise(async () => {
        return useGraphQLModules(await modulesApplication);
      });
    },
  };
};

export { gql };
