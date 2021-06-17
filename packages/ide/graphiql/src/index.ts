import { LazyPromise } from '@graphql-ez/core-utils/promise';
import type { RenderGraphiQLOptions } from 'graphql-helix/dist/types';
import type { EZPlugin, RequestHandler } from '@graphql-ez/core-types';

export interface GraphiQLOptions extends RenderGraphiQLOptions {
  /**
   * The endpoint requests should be sent. Defaults to `"/graphiql"`.
   */
  endpoint?: string;
}

const GraphiQLDeps = LazyPromise(async () => {
  const { renderGraphiQL } = await import('graphql-helix/dist/render-graphiql.js');

  return { renderGraphiQL };
});

export function GraphiQLHandler(options: GraphiQLOptions | boolean = {}): RequestHandler {
  const { endpoint = '/graphiql', ...renderOptions } = typeof options === 'object' ? options : {};

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  return async function (req, res) {
    if (req.method?.toUpperCase() !== 'GET') return res.writeHead(404).end();

    res.setHeader('content-type', 'text/html');
    res.end(await html);
  };
}

export const GraphiQLIDE = (options?: GraphiQLOptions | boolean): EZPlugin => {
  return {
    onRegister(ctx) {
      ctx.graphiQLHandler = GraphiQLHandler;
      (ctx.options.ide ||= {}).graphiql = options;
    },
  };
};

declare module '@graphql-ez/core-types' {
  interface InternalAppBuildContext {
    graphiQLHandler?: typeof GraphiQLHandler;
  }

  interface IDEOptions {
    graphiql?: GraphiQLOptions | boolean;
  }
}
