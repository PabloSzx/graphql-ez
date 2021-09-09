import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import type { EZPlugin } from 'graphql-ez';
import { onIntegrationRegister } from './integrations';
import type { GraphiQLOptions, IDEHandler } from './types';

const GraphiQLDeps = LazyPromise(async () => {
  const { renderGraphiQL } = await import('@pablosz/graphql-helix-graphiql');

  return { renderGraphiQL };
});

export function GraphiQLHandler(options: GraphiQLOptions): IDEHandler {
  const { endpoint = '/graphql', ...renderOptions } = getObjectValue(options) || {};

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  return async function (_req, res) {
    res.setHeader('content-type', 'text/html');
    res.end(await html);
  };
}

export function GraphiQLRender(options: GraphiQLOptions): Promise<string> {
  const { endpoint = '/graphql', ...renderOptions } = getObjectValue(options) || {};

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  return html;
}

export const ezGraphiQLIDE = (options: GraphiQLOptions | boolean = true): EZPlugin => {
  return {
    name: 'GraphiQL IDE',
    compatibilityList: {
      fastify: true,
      koa: true,
      express: true,
      hapi: true,
      http: true,
      nextjs: true,
      sveltekit: true,
      cloudflare: true,
      vercel: true,
    },
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...(getObjectValue(options) || {}) };

      const path = (objOptions.path ||= ctx.options.path || '/graphql');

      objOptions.endpoint ||= ctx.options.path;

      ctx.graphiql = {
        path,
        handler: GraphiQLHandler,
        options: objOptions,
        html: LazyPromise(() => {
          return GraphiQLDeps.then(({ renderGraphiQL }) => {
            const { endpoint = '/graphql', ...renderOptions } = getObjectValue(ctx.graphiql?.options) || {};

            return renderGraphiQL({ ...renderOptions, endpoint });
          });
        }),
      };
    },
    onIntegrationRegister,
  };
};

export * from './types';
