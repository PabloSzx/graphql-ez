import DataLoader from 'dataloader';
import { useDataLoader } from '@envelop/dataloader';

import type { EZPlugin, EZContext } from '@graphql-ez/core-types';

export type DataLoaderFn<K, V, C = K> = (DataLoaderClass: typeof DataLoader, context: EZContext) => DataLoader<K, V, C>;

export type RegisteredDataLoader<Name extends string, Key, Value, Cache = Key> = {
  name: Name;
  dataLoaderFactory: DataLoaderFn<Key, Value, Cache>;
};

export type RegisterDataLoader = <Name extends string, Key, Value, Cache = Key>(
  name: Name,
  dataLoaderFactory: DataLoaderFn<Key, Value, Cache>
) => RegisteredDataLoader<Name, Key, Value, Cache>;

declare module '@graphql-ez/core-types' {
  interface BaseAppBuilder {
    registerDataLoader: RegisterDataLoader;
  }
}

export type InferDataLoader<V> = V extends RegisteredDataLoader<infer Name, infer Key, infer Value, infer Cache>
  ? { [k in Name]: DataLoader<Key, Value, Cache> }
  : {};

export const ezDataLoader = (): EZPlugin => {
  return {
    name: 'DataLoader',
    onRegister(ctx) {
      function registerDataLoader<Name extends string, Key, Value, Cache = Key>(
        name: Name,
        dataLoaderFactory: DataLoaderFn<Key, Value, Cache>
      ): RegisteredDataLoader<Name, Key, Value, Cache> {
        ctx.options.envelop.plugins.push(
          useDataLoader(name, context => {
            return dataLoaderFactory(DataLoader, context);
          })
        );
        return {
          name,
          dataLoaderFactory,
        };
      }

      ctx.appBuilder.registerDataLoader = registerDataLoader;
    },
  };
};
