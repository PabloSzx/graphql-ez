import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import type { EZPlugin } from 'graphql-ez';
import type { IncomingMessage, ServerResponse } from 'http';
import type { RenderVoyagerOptions } from './render';

export interface VoyagerPluginOptions extends VoyagerOptions {
  /**
   * @default "/voyager"
   */
  path?: string;
}

export interface VoyagerOptions extends RenderVoyagerOptions {
  /**
   * Manually transform the rendered HTML
   */
  transformHtml?: (html: string) => string;
}

declare module 'graphql-ez' {
  interface InternalAppBuildContext {
    voyager?: {
      path: string;
      options: VoyagerOptions;
      handler: typeof VoyagerHandler;
      render: () => Promise<string>;
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
    compatibilityList: {
      fastify: true,
      koa: true,
      express: true,
      hapi: true,
      http: true,
      nextjs: true,
      sveltekit: true,
      cloudflare: true,
    },
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...(getObjectValue(options) || {}) };

      const path = (objOptions.path ||= '/voyager');

      objOptions.endpoint ||= ctx.options.path;

      ctx.voyager = {
        path,
        handler: VoyagerHandler,
        options: objOptions,
        async render() {
          const { transformHtml, ...renderOptions } = getObjectValue(ctx.voyager?.options) || {};

          const html = VoyagerDeps.then(({ renderVoyagerPage }) => {
            const content = renderVoyagerPage(renderOptions);

            if (transformHtml) return transformHtml(content);

            return content;
          });

          return html;
        },
      };
    },
    onIntegrationRegister(ctx) {
      if (!ctx.voyager) return;

      const voyager = ctx.voyager;
      return {
        fastify({ integration }) {
          const handler = voyager.handler(voyager.options);

          integration.get(voyager.path, async (req, res) => {
            res.hijack();
            await handler(req.raw, res.raw);
          });
        },
        express({ integration: { router } }) {
          const handler = voyager.handler(voyager.options);

          router.get(voyager.path, async (req, res) => {
            await handler(req, res);
          });
        },
        koa({ integration: { router } }) {
          const handler = voyager.handler(voyager.options, {
            rawHttp: false,
          });

          router.get(voyager.path, async ctx => {
            const result = await handler(ctx.req, ctx.res);

            ctx.type = 'text/html';
            ctx.body = result.content;
          });
        },
        hapi({ integration: { server, ideRouteOptions } }) {
          const ideHandler = voyager.handler(voyager.options);

          server.route({
            path: voyager.path,
            method: 'GET',
            options: ideRouteOptions,
            async handler(req, h) {
              await ideHandler(req.raw.req, req.raw.res);
              return h.abandon;
            },
          });
        },
        async http({ integration: { handlers } }) {
          const { getPathname } = await import('@graphql-ez/utils/url');

          const handler = voyager.handler(voyager.options);

          const path = voyager.path;

          handlers.push(async (req, res) => {
            if (req.method !== 'GET' || getPathname(req.url) !== path) return;

            await handler(req, res);

            return {
              stop: true,
            };
          });
        },
        nextjs() {
          return console.warn(
            `[graphql-ez] You don't need to add the Voyager plugin in your EZ App for Next.js, use "VoyagerHandler" directly in your API Routes.`
          );
        },
        vercel() {
          return console.warn(
            `[graphql-ez] You don't need to add the Voyager plugin in your EZ App for Vercel, use "VoyagerHandler" directly in your API Routes.`
          );
        },
        async sveltekit({ integration: { handlers } }) {
          const html = await voyager.render();

          const path = voyager.path;

          handlers.push(req => {
            if (req.method !== 'GET' || path !== req.path) return;

            return {
              status: 200,
              headers: {
                'content-type': 'text/html',
              },
              body: html,
            };
          });
        },
        async cloudflare({ integration: { router } }) {
          const html = await voyager.render();

          router.add('GET', voyager.path, (_req, res) => {
            res.setHeader('content-type', 'text/html');
            res.end(html);
          });
        },
      };
    },
  };
};

export * from './render';
