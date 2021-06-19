import { getObjectValue } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import { onIntegrationRegister } from './integrations';

import type { RenderGraphiQLOptions } from 'graphql-helix/dist/types';

import type { EZPlugin, RequestHandler } from '@graphql-ez/core-types';
export interface GraphiQLOptions extends RenderGraphiQLOptions {
  /**
   * @default "/graphiql"
   */
  path?: string;
  /**
   * The endpoint requests should be sent.
   *
   * @default "/graphql"
   */
  endpoint?: string;
}

const GraphiQLDeps = LazyPromise(async () => {
  const { renderGraphiQL } = await import('graphql-helix/dist/render-graphiql.js');

  return { renderGraphiQL };
});

export function GraphiQLHandler(options: GraphiQLOptions | boolean = {}): RequestHandler {
  const { endpoint = '/graphql', ...renderOptions } = getObjectValue(options) || {};

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  return async function (req, res) {
    if (req.method?.toUpperCase() !== 'GET') return res.writeHead(404).end();

    res.setHeader('content-type', 'text/html');
    res.end(await html);
  };
}

export const GraphiQLEZIde = (options: GraphiQLOptions | boolean = true): EZPlugin => {
  return {
    onRegister(ctx) {
      const objOptions = { ...(getObjectValue(options) || {}) };

      const path = (objOptions.path ||= '/graphiql');
      objOptions.endpoint ||= ctx.options.path;

      ctx.graphiql = {
        path,
        handler: GraphiQLHandler,
        options: objOptions,
      };
    },
    onIntegrationRegister,
  };
};

declare module '@graphql-ez/core-types' {
  interface InternalAppBuildContext {
    graphiql?: {
      path: string;
      handler: typeof GraphiQLHandler;
      options: GraphiQLOptions;
    };
  }
}
