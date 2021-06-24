import { getObjectValue } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import { onIntegrationRegister } from './integrations';

import type { IncomingMessage, ServerResponse } from 'http';
import type { RenderGraphiQLOptions } from 'graphql-helix/dist/types';
import type { EZPlugin } from '@graphql-ez/core-types';

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

declare module '@graphql-ez/core-types' {
  interface InternalAppBuildContext {
    graphiql?: {
      path: string;
      handler: (options: GraphiQLOptions, extraConfig?: HandlerConfig) => IDEHandler;
      options: GraphiQLOptions;
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

const GraphiQLDeps = LazyPromise(async () => {
  const { renderGraphiQL } = await import('graphql-helix/dist/render-graphiql.js');

  return { renderGraphiQL };
});

export function GraphiQLHandler(options: GraphiQLOptions, extraConfig?: HandlerConfig): IDEHandler {
  const { endpoint = '/graphql', ...renderOptions } = getObjectValue(options) || {};

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  const rawHttp = extraConfig?.rawHttp ?? true;

  return async function (_req, res) {
    const content = await html;

    if (rawHttp) {
      res.setHeader('content-type', 'text/html');
      res.end(await html);
    }

    return {
      content,
    };
  };
}

export const ezGraphiQLIDE = (options: GraphiQLOptions | boolean = true): EZPlugin => {
  return {
    name: 'GraphiQL IDE',
    compatibilityList: ['fastify', 'koa', 'express', 'hapi', 'http', 'nextjs'],
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
