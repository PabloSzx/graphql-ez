import { LazyPromise } from '@graphql-ez/utils/promise';

export const lazyDeps = LazyPromise(() => import('./deps.js'));
