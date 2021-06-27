import { getObjectValue } from 'graphql-ez/utils/object';
import { LazyPromise } from 'graphql-ez/utils/promise';

import { onIntegrationRegister } from './integrations';

import type { IncomingMessage, ServerResponse } from 'http';
import type { EZPlugin } from 'graphql-ez';
import type { RenderVoyagerOptions } from './render';

export interface VoyagerPluginOptions extends VoyagerOptions {
  /**
   * @default "/voyager"
   */
  path?: string;
}

export interface VoyagerOptions extends RenderVoyagerOptions {
  transformHtml?: (html: string) => string;
}

declare module 'graphql-ez/types' {
  interface InternalAppBuildContext {
    voyager?: {
      path: string;
      options: VoyagerOptions;
      handler: typeof VoyagerHandler;
    };
  }
}

export type IDEHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<{
  content: string;
}>;

export interface HandlerConfig {
  /**
   * @default true
   */
  rawHttp?: boolean;
}

const VoyagerDeps = LazyPromise(async () => {
  const { renderVoyagerPage } = await import('./render');

  return { renderVoyagerPage };
});

export function VoyagerHandler(options?: VoyagerOptions, extraConfig?: HandlerConfig): IDEHandler {
  const { transformHtml, ...renderOptions } = getObjectValue(options) || {};

  const html = VoyagerDeps.then(({ renderVoyagerPage }) => {
    const content = renderVoyagerPage(renderOptions);

    if (transformHtml) return transformHtml(content);

    return content;
  });

  const rawHttp = extraConfig?.rawHttp ?? true;

  return async function (_req, res) {
    const content = await html;

    if (rawHttp) {
      res.setHeader('content-type', 'text/html');
      res.end(content);
    }

    return {
      content,
    };
  };
}

export const ezVoyager = (options: VoyagerPluginOptions | boolean = true): EZPlugin => {
  return {
    name: 'GraphQL Voyager',
    compatibilityList: ['fastify', 'koa', 'express', 'hapi', 'http', 'nextjs'],
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...(getObjectValue(options) || {}) };

      const path = (objOptions.path ||= '/voyager');

      objOptions.endpointUrl ||= ctx.options.path;

      ctx.voyager = {
        path,
        handler: VoyagerHandler,
        options: objOptions,
      };
    },
    onIntegrationRegister,
  };
};

export * from './render';
