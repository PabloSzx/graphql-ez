import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import type { EZPlugin } from 'graphql-ez';
import { onIntegrationRegister } from './integrations';
import type { GraphiQLOptions, IDEHandler } from './types';

const GraphiQLDeps = LazyPromise(async () => {
  const { renderStaticGraphiQL } = await import('@pablosz/graphql-helix-graphiql/static');

  return { renderStaticGraphiQL };
});

export function StaticGraphiQLHandler(options: GraphiQLOptions): IDEHandler {
  const { endpoint = '/graphql', ...renderOptions } = getObjectValue(options) || {};

  const html = GraphiQLDeps.then(({ renderStaticGraphiQL }) => {
    return renderStaticGraphiQL({ ...renderOptions, endpoint });
  });

  return async function (_req, res) {
    res.setHeader('content-type', 'text/html');
    res.end(await html);
  };
}

export function StaticGraphiQLRender(options: GraphiQLOptions): Promise<string> {
  const { endpoint = '/graphql', ...renderOptions } = getObjectValue(options) || {};

  const html = GraphiQLDeps.then(({ renderStaticGraphiQL }) => {
    return renderStaticGraphiQL({ ...renderOptions, endpoint });
  });

  return html;
}

export const ezStaticGraphiQLIDE = (options: GraphiQLOptions | boolean = true): EZPlugin => {
  return {
    name: 'GraphiQL IDE',
    compatibilityList: ['fastify', 'koa', 'express', 'hapi', 'http', 'nextjs', 'sveltekit', 'vercel'],
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...(getObjectValue(options) || {}) };

      const path = (objOptions.path ||= ctx.options.path || '/graphql');

      objOptions.endpoint ||= ctx.options.path;

      ctx.graphiql = {
        path,
        handler: StaticGraphiQLHandler,
        options: objOptions,
        html: LazyPromise(() => {
          return GraphiQLDeps.then(({ renderStaticGraphiQL }) => {
            const { endpoint = '/graphql', ...renderOptions } = getObjectValue(ctx.graphiql?.options) || {};

            return renderStaticGraphiQL({ ...renderOptions, endpoint });
          });
        }),
      };
    },
    onIntegrationRegister,
  };
};

export * from './types';
