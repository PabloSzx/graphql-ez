import DataLoader from 'dataloader';
import { useDataLoader } from '@envelop/dataloader';

import type { EZPlugin, EZContext } from 'graphql-ez';

export type DataLoaderFn<Key, Value, CacheKey = Key> = (
  DataLoaderClass: typeof DataLoader,
  context: EZContext
) => DataLoader<Key, Value, CacheKey>;

export type DataLoaderFactory<Key, Value, CacheKey> = () => DataLoader<Key, Value, CacheKey>;

export type RegisteredDataLoader<Name extends string, Key, Value, CacheKey = Key> = {
  name: Name;
  dataLoaderFactory: DataLoaderFactory<Key, Value, CacheKey>;
};

export type RegisterDataLoader = <Name extends string, Key, Value, CacheKey = Key>(
  name: Name,
  dataLoaderFactory: DataLoaderFn<Key, Value, CacheKey>
) => RegisteredDataLoader<Name, Key, Value, CacheKey>;

declare module 'graphql-ez/types/index' {
  interface BaseAppBuilder {
    registerDataLoader: RegisterDataLoader;
  }
}

export type InferDataLoader<V> = V extends RegisteredDataLoader<infer Name, infer Key, infer Value, infer Cache>
  ? { [k in Name]: DataLoader<Key, Value, Cache> }
  : never;

export const ezDataLoader = (): EZPlugin => {
  return {
    name: 'DataLoader',
    onRegister(ctx) {
      function registerDataLoader<Name extends string, Key, Value, CacheKey = Key>(
        name: Name,
        dataLoaderFactory: DataLoaderFn<Key, Value, CacheKey>
      ): RegisteredDataLoader<Name, Key, Value, CacheKey> {
        ctx.options.envelop.plugins.push(
          useDataLoader<Key, Value, CacheKey, EZContext>(name, context => {
            return dataLoaderFactory(DataLoader, context);
          })
        );
        return {
          name,
          dataLoaderFactory: dataLoaderFactory as DataLoaderFactory<Key, Value, CacheKey>,
        };
      }

      ctx.appBuilder.registerDataLoader = registerDataLoader;
    },
  };
};
