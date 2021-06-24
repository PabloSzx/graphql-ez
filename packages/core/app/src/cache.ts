import { getObjectValue } from '@graphql-ez/core-utils/object';

import type { ParserCacheOptions } from '@envelop/parser-cache';
import type { ValidationCacheOptions } from '@envelop/validation-cache';
import type { EZPlugin } from '@graphql-ez/core-types';

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

declare module '@graphql-ez/core-types' {
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

export const ezCache = (): EZPlugin => {
  return {
    name: 'Cache',
    async onPreBuild(ctx) {
      const {
        cache,
        envelop: { plugins = [] },
      } = ctx.options;
      if (!cache) return;

      const isParserEnabled = cache === true || !!cache.parse;
      const isValidationEnabled = cache === true || !!cache.validation;

      const cacheObj = getObjectValue(cache);

      const parserOptions = getObjectValue(cacheObj?.parse) || {};

      const validationOptions = getObjectValue(cacheObj?.validation) || {};

      await Promise.all([
        isParserEnabled
          ? import('@envelop/parser-cache').then(({ useParserCache }) => {
              plugins.push(useParserCache(parserOptions));
            })
          : null,
        isValidationEnabled
          ? import('@envelop/validation-cache').then(({ useValidationCache }) => {
              plugins.push(useValidationCache(validationOptions));
            })
          : null,
      ]);
    },
  };
};
