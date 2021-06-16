import { BaseEnvelopAppOptions, BaseEnvelopBuilder, createEnvelopAppFactory, handleRequest } from '@graphql-ez/core/app';
import { gql, LazyPromise } from '@graphql-ez/core/base';
import { handleCodegen, WithCodegen } from '@graphql-ez/core/codegen/handle';
import { handleCors, WithCors } from '@graphql-ez/core/cors/rawCors';

import type { RenderGraphiQLOptions } from 'graphql-helix/dist/types';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import type { EnvelopContext } from '@graphql-ez/core/types';
import type { RenderOptions } from './altairStatic';
import type { Envelop } from '@envelop/types';

declare module '@graphql-ez/core/types' {
  interface BuildContextArgs {
    next?: {
      req: NextApiRequest;
      res: NextApiResponse;
    };
  }
}

export interface EnvelopAppOptions extends BaseEnvelopAppOptions<EnvelopContext>, WithCodegen, WithCors {}

export interface BuildAppOptions {
  prepare?: (appBuilder: BaseEnvelopBuilder) => void | Promise<void>;
}

export interface EnvelopApp {
  handler: NextApiHandler<unknown>;
  getEnveloped: Promise<Envelop<unknown>>;
}

export interface EnvelopAppBuilder extends BaseEnvelopBuilder {
  buildApp(options?: BuildAppOptions): EnvelopApp;
}

export function CreateApp(config: EnvelopAppOptions = {}): EnvelopAppBuilder {
  const { appBuilder, ...commonApp } = createEnvelopAppFactory(config, {
    afterBuilt(getEnveloped) {
      handleCodegen(getEnveloped, config, {
        moduleName: 'nextjs',
      });
    },
  });

  function buildApp({ prepare }: BuildAppOptions = {}): EnvelopApp {
    let app: NextApiHandler<unknown> | undefined;
    const { buildContext, customHandleRequest } = config;

    const corsMiddleware = handleCors(config);

    const appPromise = appBuilder({
      prepare,
      adapterFactory(getEnveloped): NextApiHandler<unknown> {
        const requestHandler = customHandleRequest || handleRequest;

        const handler: NextApiHandler<unknown> = async (req, res) => {
          const request = {
            body: req.body,
            headers: req.headers,
            method: req.method!,
            query: req.query,
          };

          return requestHandler({
            request,
            getEnveloped,
            baseOptions: config,
            buildContext,
            buildContextArgs() {
              return {
                req,
                next: {
                  req,
                  res,
                },
              };
            },
            onResponse(result) {
              res.status(result.status).json(result.payload);
            },
            onMultiPartResponse(result, defaultHandle) {
              return defaultHandle(req, res, result);
            },
            onPushResponse(result, defaultHandle) {
              return defaultHandle(req, res, result);
            },
          });
        };

        if (corsMiddleware) {
          return async (req, res) => {
            (await corsMiddleware)(req, res, config.cors);

            await handler(req, res);
          };
        }
        return handler;
      },
    });

    appPromise.then(handler => {
      app = handler.app;
    });

    return {
      async handler(req, res) {
        await (app || (await appPromise).app)(req, res);
      },
      getEnveloped: LazyPromise(() => appPromise.then(v => v.getEnveloped)),
    };
  }

  return {
    ...commonApp,
    buildApp,
  };
}

export interface GraphiQLHandlerOptions extends RenderGraphiQLOptions {
  /**
   * The endpoint requests should be sent. Defaults to `"/api/graphql"`.
   */
  endpoint?: string;
}

const GraphiQLDeps = LazyPromise(async () => {
  const { renderGraphiQL } = await import('graphql-helix/dist/render-graphiql.js');

  return { renderGraphiQL };
});

export function GraphiQLHandler(options: GraphiQLHandlerOptions = {}): NextApiHandler<unknown> {
  const { endpoint = '/api/graphql', ...renderOptions } = options;

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  return async function (req, res) {
    if (req.method !== 'GET') return res.status(404).end();

    res.setHeader('content-type', 'text/html');
    res.send(await html);
  };
}

export interface AltairHandlerOptions extends Omit<RenderOptions, 'baseURL'>, WithCors {
  /**
   *  Request Path
   *
   * @default "/api/altair"
   */
  path?: string;

  /**
   * URL to set as the server endpoint
   *
   * @default "/api/graphql"
   */
  endpointURL?: string;
}

export function AltairHandler(options: AltairHandlerOptions = {}): NextApiHandler<unknown> {
  let { path = '/api/altair', endpointURL = '/api/graphql', ...renderOptions } = options;

  const baseURL = path.endsWith('/') ? (path = path.slice(0, path.length - 1)) + '/' : path + '/';

  return async function (req, res) {
    const { renderAltair } = await import('./altairStatic');

    switch (req.url) {
      case path:
      case baseURL: {
        res.setHeader('content-type', 'text/html');

        return res.send(
          await renderAltair({
            ...renderOptions,
            baseURL,
            endpointURL,
          })
        );
      }
      case undefined: {
        return res.status(404).end();
      }
      default: {
        const resolvedPath = 'https://unpkg.com/altair-static@4.0.6/build/dist/' + req.url.slice(baseURL.length);

        const fetchResult = await fetch(resolvedPath).catch(() => null);

        if (!fetchResult) return res.status(404).end();

        const result = await fetchResult.arrayBuffer().catch(() => null);

        if (!result) return res.status(404).end();

        const contentType = fetchResult.headers.get('content-type');
        if (contentType) res.setHeader('content-type', contentType);
        res.end(Buffer.from(result));
      }
    }
  };
}

export { gql };

export * from '@graphql-ez/core/base';
