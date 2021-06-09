import { LazyPromise } from './utils/promise';

import { isDocumentNode } from '@graphql-tools/utils';

import type { ApplicationConfig, Module, TypeDefs } from 'graphql-modules';
import type { EnvelopModuleConfig } from './types';

const GraphQLModules = LazyPromise(async () => {
  const { createModule } = await import('graphql-modules');

  return { createModule };
});

export interface WithGraphQLModules {
  /**
   * __Not needed if using `registerModule`__
   *
   * List of extra GraphQL Modules instances
   */
  modules?: (Module | Promise<Module>)[];
  /**
   * Custom GraphQL Modules configuration
   */
  GraphQLModules?: Partial<Omit<ApplicationConfig, 'modules'>>;
}

export interface RegisterModule {
  (module: Module): Module;
  (typeDefs: TypeDefs, options?: EnvelopModuleConfig): Promise<Module>;
}

export interface RegisterModuleState {
  registerModuleState: {
    acumId: number;
  };

  registerModule: RegisterModule;
}

export function RegisterModuleFactory(modules: (Module | Promise<Module>)[]): RegisterModuleState {
  const state: RegisterModuleState = {
    registerModuleState: {
      acumId: 0,
    },
    registerModule,
  };

  return state;

  function registerModule(typeDefs: TypeDefs, config?: EnvelopModuleConfig): Promise<Module>;
  function registerModule(module: Module): Module;
  function registerModule(firstParam: TypeDefs | Module, options?: EnvelopModuleConfig) {
    if (Array.isArray(firstParam) || isDocumentNode(firstParam)) {
      const { id = `module${++state.registerModuleState.acumId}`, autoAdd = true } = options || {};

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
}

export { gql } from './utils/gql';
