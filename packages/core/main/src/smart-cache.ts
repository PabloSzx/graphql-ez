import type { DisableIntrospectionOptions } from '@envelop/disable-introspection';
import type { ParserCacheOptions } from '@envelop/parser-cache';
import type { Plugin, ValidateFunctionParameter } from '@envelop/types';
import type { ValidationCacheOptions } from '@envelop/validation-cache';
import { getObjectValue } from '@graphql-ez/utils/object';
import type { DocumentNode, GraphQLError } from 'graphql';
import { NoSchemaIntrospectionCustomRule, print } from 'graphql';
import lru from 'tiny-lru';
import type { EZContext } from './index';
import type { EZPlugin } from './types';

const DEFAULT_MAX = 1000;
const DEFAULT_TTL = 3600000;

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

export interface EZIntrospectionOptions {
  /**
   * Disable GraphQL Schema introspection
   */
  disable?:
    | {
        disableIf?: (args: { context: EZContext; params: ValidateFunctionParameter }) => boolean;
      }
    | boolean;
}

declare module './index' {
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

    /**
     * Enable/Disable/Configure GraphQL Schema introspection
     */
    introspection?: EZIntrospectionOptions;
  }
}

export const SmartCacheIntrospection = (): NonNullable<EZPlugin['onPreBuild']> => {
  const DocumentKeyMap = new WeakMap<DocumentNode, string>();

  let isValidationCacheDisabled: boolean;

  const useParserCache = (pluginOptions: ParserCacheOptions = {}): Plugin<EZContext> => {
    const max = typeof pluginOptions.max === 'number' ? pluginOptions.max : DEFAULT_MAX;
    const ttl = typeof pluginOptions.ttl === 'number' ? pluginOptions.ttl : DEFAULT_TTL;

    const documentCache = lru<DocumentNode>(max, ttl);
    const errorCache = lru<Error>(max, ttl);

    return {
      onParse({ params: { source }, setParsedDocument }) {
        const key = typeof source === 'object' ? source.body : source;

        const errorValue = errorCache.get(key);

        if (errorValue) throw errorValue;

        const documentCacheValue = documentCache.get(key);

        if (documentCacheValue) setParsedDocument(documentCacheValue);

        return ({ result }) => {
          if (result instanceof Error) {
            errorCache.set(key, result);
          } else if (result !== null) {
            documentCache.set(key, result);
            DocumentKeyMap.set(result, key);
          }
        };
      },
    };
  };

  const useValidationCache = (pluginOptions: ValidationCacheOptions = {}): Plugin<EZContext> => {
    const max = typeof pluginOptions.max === 'number' ? pluginOptions.max : DEFAULT_MAX;
    const ttl = typeof pluginOptions.ttl === 'number' ? pluginOptions.ttl : DEFAULT_TTL;

    const resultCache = lru<readonly GraphQLError[]>(max, ttl);

    return {
      onSchemaChange() {
        resultCache.clear();
      },
      onValidate({ params: { documentAST }, setResult }) {
        let key = DocumentKeyMap.get(documentAST);

        if (key == null) key = print(documentAST);

        const cacheValue = resultCache.get(key);

        if (cacheValue) setResult(cacheValue);

        return ({ result }) => {
          resultCache.set(key!, result);
        };
      },
    };
  };

  const useDisableIntrospection = (options?: DisableIntrospectionOptions): Plugin<EZContext> => {
    const disableIf = options?.disableIf;
    return {
      onValidate: disableIf
        ? ({ addValidationRule, context, params }) => {
            const shouldDisableIntrospection = disableIf({ context, params });

            if (shouldDisableIntrospection) addValidationRule(NoSchemaIntrospectionCustomRule);

            // If validation cache is disabled, skip
            if (isValidationCacheDisabled) return;

            const { documentAST } = params;

            const disableIntrospectionFlag = shouldDisableIntrospection ? '1' : '0';

            // We add a small flag to the document key to differentiate if the
            // incoming operation has permission for introspection or it doesn't

            const documentKey = DocumentKeyMap.get(documentAST);
            if (documentKey) {
              DocumentKeyMap.set(documentAST, documentKey + disableIntrospectionFlag);
            } else {
              DocumentKeyMap.set(documentAST, print(documentAST) + disableIntrospectionFlag);
            }
          }
        : ({ addValidationRule }) => {
            addValidationRule(NoSchemaIntrospectionCustomRule);
          },
    };
  };

  return function smartCache(ctx) {
    const cache = ctx.options.cache;
    const envelopPlugins = ctx.options.envelop.plugins;

    const introspection = ctx.options.introspection;

    const isParserEnabled = cache ? cache === true || !!cache.parse : false;
    const isValidationEnabled = cache ? cache === true || !!cache.validation : false;
    isValidationCacheDisabled = !isValidationEnabled;

    if (introspection?.disable) {
      envelopPlugins.push(useDisableIntrospection(getObjectValue(introspection.disable)));
    }

    if (cache) {
      const cacheObj = getObjectValue(cache);

      if (isParserEnabled) {
        envelopPlugins.push(useParserCache(getObjectValue(cacheObj?.parse)));
      }

      if (isValidationEnabled) {
        envelopPlugins.push(useValidationCache(getObjectValue(cacheObj?.validation)));
      }
    }
  };
};
