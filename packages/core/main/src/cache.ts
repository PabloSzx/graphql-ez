import { getObjectValue } from './utils/object';

import type { ParserCacheOptions } from '@envelop/parser-cache';
import type { ValidationCacheOptions } from '@envelop/validation-cache';
import type { InternalAppBuildContext } from './types';

export type CacheOptions =
  | boolean
  | {
      /**
       * Enable/Disable or configure cache options
       * @default true
       */
      parse?: boolean | ParserCacheOptions;
      /**
       * Enable/Disable or configure cache options
       * @default true
       */
      validation?: boolean | ValidationCacheOptions;
    };

declare module './types' {
  interface AppOptions {
    /**
     * Enable/Disable/Configure in-memory cache that improves performance
     *
     * `cache === true` => Enable both parse & validation cache
     *
     * `cache === false` => Disable caching
     *
     * @default false
     */
    cache?: CacheOptions;
  }
}

/**
 * `onPreBuild`
 */
export const ezCoreCache = async (ctx: InternalAppBuildContext) => {
  const {
    cache,
    envelop: { plugins },
  } = ctx.options;
  if (!cache) return;

  const isParserEnabled = cache === true || !!cache.parse;
  const isValidationEnabled = cache === true || !!cache.validation;

  const cacheObj = getObjectValue(cache);

  await Promise.all([
    isParserEnabled
      ? import('@envelop/parser-cache').then(({ useParserCache }) => {
          plugins.push(useParserCache(getObjectValue(cacheObj?.parse)));
        })
      : null,
    isValidationEnabled
      ? import('@envelop/validation-cache').then(({ useValidationCache }) => {
          plugins.push(useValidationCache(getObjectValue(cacheObj?.validation)));
        })
      : null,
  ]);
};
