import { gql } from 'graphql-ez/utils/gql';
import { toPlural } from 'graphql-ez/utils/object';
import { LazyPromise } from 'graphql-ez/utils/promise';
import { createApplication, createModule } from 'graphql-modules';

import { useGraphQLModules } from '@envelop/graphql-modules';
import { isDocumentNode } from '@graphql-tools/utils';

import type { EZResolvers, EZPlugin, Plugin as EnvelopPlugin } from 'graphql-ez';
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

declare module 'graphql-ez' {
  interface BaseAppBuilder {
    registerModule: RegisterModule;
  }

  interface InternalAppBuildContext {
    modules?: (Module | Promise<Module>)[];
    modulesApplication?: Promise<Application>;
    modulesEnvelopPlugin?: Promise<EnvelopPlugin>;
  }

  interface EZContext extends GraphQLModules.Context {}
}

export interface RegisterModule {
  (module: Module): Module;
  (module: Promise<Module>): Promise<Module>;
  (typeDefs: TypeDefs, options?: EnvelopModuleConfig): Module;
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

      function registerModule(typeDefs: TypeDefs, config?: EnvelopModuleConfig): Module;
      function registerModule(module: Module): Module;
      function registerModule(module: Promise<Module>): Promise<Module>;
      function registerModule(firstParam: TypeDefs | Module | Promise<Module>, options?: EnvelopModuleConfig) {
        if (Array.isArray(firstParam) || isDocumentNode(firstParam)) {
          const { id = `module${++registerModuleState.acumId}`, autoAdd = true } = options || {};

          const createdModule = createModule({
            typeDefs: firstParam,
            id,
            ...options,
          });

          if (autoAdd) modules.push(createdModule);

          return createdModule;
        }

        modules.push(firstParam);
        return firstParam;
      }

      const modulesApplication = (ctx.modulesApplication = LazyPromise(async () => {
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
    async onPreBuild(ctx) {
      if (!ctx.schemaPlugin && ctx.modulesEnvelopPlugin) {
        ctx.options.envelop.plugins.push(await ctx.modulesEnvelopPlugin);
      }
    },
  };
};

export { gql };
