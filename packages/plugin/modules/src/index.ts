import { useGraphQLModules } from '@envelop/graphql-modules';
import { gql } from '@graphql-ez/core-utils/gql';
import { toPlural } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';
import { isDocumentNode } from '@graphql-tools/utils';

import type { Plugin as EnvelopPlugin } from '@envelop/types';
import type { EZResolvers, EZPlugin } from '@graphql-ez/core-types';
import type { ModuleConfig, Module, TypeDefs, Application, ApplicationConfig } from 'graphql-modules';

export type EnvelopModuleConfig = Omit<ModuleConfig, 'typeDefs' | 'id' | 'resolvers'> & {
  id?: string;
  resolvers?: EZResolvers;
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

export const ezGraphQLModules = (config: Partial<Omit<ApplicationConfig, 'modules'>> = {}): EZPlugin => {
  const registerModuleState = {
    acumId: 0,
  };

  return {
    name: 'GraphQL Modules',
    onRegister(ctx) {
      const modules: Array<Promise<Module> | Module> = (ctx.modules = []);
      ctx.appBuilder.registerModule = registerModule;

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

          if (autoAdd) modules.push(promiseModule);

          return promiseModule;
        }

        modules.push(firstParam);
        return firstParam;
      }

      const modulesApplication = (ctx.modulesApplication = LazyPromise(async () => {
        const { createApplication, createModule } = await GraphQLModules;

        const [extraSchemaDefs, modulesList] = await Promise.all([
          Promise.all(ctx.extraSchemaDefinitions || []),
          Promise.all(modules),
        ]);

        const extraModules = extraSchemaDefs.length
          ? extraSchemaDefs.map(({ id, resolvers, typeDefs }) => {
              const moduleTypeDefs = toPlural(typeDefs).map(v => (typeof v === 'string' ? gql(v) : v));
              return createModule({
                id,
                dirname: id,
                typeDefs: moduleTypeDefs,
                resolvers,
              });
            })
          : undefined;

        return createApplication({
          modules: extraModules ? [...extraModules, ...modulesList] : modulesList,
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
