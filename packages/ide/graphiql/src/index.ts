import { LazyPromise } from '@graphql-ez/core-utils/promise';
import type { RenderGraphiQLOptions } from 'graphql-helix/dist/types';
import type { RequestHandler } from '@graphql-ez/core-types';

export interface GraphiQLHandlerOptions extends RenderGraphiQLOptions {
  /**
   * The endpoint requests should be sent. Defaults to `"/graphiql"`.
   */
  endpoint?: string;
}

const GraphiQLDeps = LazyPromise(async () => {
  const { renderGraphiQL } = await import('graphql-helix/dist/render-graphiql.js');

  return { renderGraphiQL };
});

export function GraphiQLHandler(options: GraphiQLHandlerOptions = {}): RequestHandler {
  const { endpoint = '/graphiql', ...renderOptions } = options;

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  return async function (req, res) {
    if (req.method !== 'GET') return res.writeHead(404).end();

    res.setHeader('content-type', 'text/html');
    res.end(await html);
  };
}
