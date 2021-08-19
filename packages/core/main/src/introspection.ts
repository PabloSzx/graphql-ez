import { getObjectValue } from '@graphql-ez/utils/object';

import type { InternalAppBuildContext, EZContext, Plugin } from './index';
import type { DisableIntrospectionOptions } from '@envelop/disable-introspection';

export interface EZIntrospectionOptions {
  /**
   * Disable GraphQL Schema introspection
   */
  disable?:
    | {
        disableIf?: (args: { context: EZContext; params: Parameters<NonNullable<Plugin['onValidate']>>[0]['params'] }) => boolean;
      }
    | boolean;
}

declare module './index' {
  interface AppOptions {
    /**
     * Enable/Disable/Configure GraphQL Schema introspection
     */
    introspection?: EZIntrospectionOptions;
  }
}

/**
 * `onPreBuild`
 */
export const ezCoreDisableIntrospection = async ({ options: { introspection, envelop } }: InternalAppBuildContext) => {
  if (introspection?.disable) {
    const { useDisableIntrospection } = await import('@envelop/disable-introspection');

    envelop.plugins.push(useDisableIntrospection(getObjectValue(introspection.disable) as DisableIntrospectionOptions));
  }
};
