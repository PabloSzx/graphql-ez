import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';

import { onIntegrationRegister } from './integrations';

import type { IncomingMessage, ServerResponse } from 'http';
import type { RenderGraphiQLOptions } from '@pablosz/graphql-helix-graphiql';
import type { EZPlugin } from 'graphql-ez';

export interface GraphiQLOptions extends RenderGraphiQLOptions {
  /**
   * By default it's the same as the main API path, normally `"/graphql"` or `"/api/graphql"`
   */
  path?: string;
  /**
   * The endpoint requests should be sent.
   *
   * @default "/graphql"
   */
  endpoint?: string;
}

declare module 'graphql-ez' {
  interface InternalAppBuildContext {
    graphiql?: {
      path: string;
      handler: (options: GraphiQLOptions) => IDEHandler;
      html: Promise<string>;
      options: GraphiQLOptions;
    };
  }
}

export type IDEHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export interface HandlerConfig {
  /**
   * @default true
   */
  rawHttp?: boolean;
}

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
    compatibilityList: ['fastify', 'koa', 'express', 'hapi', 'http', 'nextjs'],
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
