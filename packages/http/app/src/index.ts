import querystring from 'querystring';

import { BaseEZAppOptions, BaseEnvelopBuilder, createEZAppFactory, handleRequest } from '@graphql-ez/core/app';
import { gql, LazyPromise } from '@graphql-ez/core/base';
import { handleCodegen, WithCodegen } from '@graphql-ez/core/codegen/handle';
import { handleCors, WithCors } from '@graphql-ez/core/cors/rawCors';
import { parseIDEConfig, WithIDE } from '@graphql-ez/core/ide/handle';
import { RawAltairHandler } from '@graphql-ez/core/ide/rawAltair';
import { handleJit, WithJit } from '@graphql-ez/core/jit';
import { getPathname } from '@graphql-ez/core/utils/url';

import type { RenderGraphiQLOptions } from 'graphql-helix/dist/types';
import type { EnvelopContext } from '@graphql-ez/core/types';
import type { RenderOptions } from 'altair-static';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Envelop } from '@envelop/types';

declare module '@graphql-ez/core/types' {
  interface BuildContextArgs {
    res?: ServerResponse;
  }
}

export interface EZAppOptions extends BaseEZAppOptions<EnvelopContext>, WithCodegen, WithJit, WithIDE, WithCors {
  /**
   * @default "/graphql"
   */
  path?: string;

  /**
   * Handle Not Found
   *
   * @default true
   */
  handleNotFound?: boolean;
}

export interface BuildAppOptions {
  prepare?: (appBuilder: BaseEnvelopBuilder) => void | Promise<void>;
}

export type AsyncRequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;
export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

export interface EZApp {
  requestHandler: AsyncRequestHandler;
  getEnveloped: Promise<Envelop>;
}

export interface EZAppBuilder extends BaseEnvelopBuilder {
  buildApp(options?: BuildAppOptions): EZApp;
}

export function CreateApp(config: EZAppOptions = {}): EZAppBuilder {
  const { appBuilder, ...commonApp } = createEZAppFactory(config, {
    async preBuild(plugins) {
      await handleJit(config, plugins);
    },
    afterBuilt(getEnveloped) {
      handleCodegen(getEnveloped, config, {
        moduleName: 'http',
      });
    },
  });

  function buildApp({ prepare }: BuildAppOptions): EZApp {
    let app: AsyncRequestHandler | undefined;
    const {
      buildContext,
      path = '/graphql',
      ide = { altair: true, graphiql: true },
      handleNotFound = true,
      customHandleRequest,
    } = config;

    const corsMiddleware = handleCors(config);

    const appPromise = appBuilder({
      prepare,
      adapterFactory(getEnveloped): AsyncRequestHandler {
        const { altairOptions, graphiQLOptions, isAltairEnabled, isGraphiQLEnabled } = parseIDEConfig(ide, path);

        const requestHandler = customHandleRequest || handleRequest;

        const handler: AsyncRequestHandler = async function (req, res): Promise<void> {
          const pathname = getPathname(req.url)!;

          if (pathname !== path) {
            if (isAltairEnabled && pathname.startsWith(altairOptions.path)) {
              return AltairHandler(altairOptions)(req, res);
            } else if (isGraphiQLEnabled && pathname === graphiQLOptions.path) {
              return GraphiQLHandler(graphiQLOptions)(req, res);
            }

            if (handleNotFound) return res.writeHead(404).end();
          }

          let payload = '';

          req.on('data', (chunk: Buffer) => {
            payload += chunk.toString('utf-8');
          });

          req.on('end', async () => {
            try {
              const body = payload ? JSON.parse(payload) : undefined;

              const urlQuery = req.url?.split('?')[1];

              const request = {
                body,
                headers: req.headers,
                method: req.method!,
                query: urlQuery ? querystring.parse(urlQuery) : {},
              };

              await requestHandler({
                request,
                getEnveloped,
                baseOptions: config,
                buildContextArgs() {
                  return {
                    req,
                    res,
                  };
                },
                buildContext,
                onResponse(result, defaultHandle) {
                  return defaultHandle(req, res, result);
                },
                onMultiPartResponse(result, defaultHandle) {
                  return defaultHandle(req, res, result);
                },
                onPushResponse(result, defaultHandle) {
                  return defaultHandle(req, res, result);
                },
              });
            } catch (err) /* istanbul ignore next */ {
              res
                .writeHead(500, {
                  'Content-Type': 'application/json',
                })
                .end(
                  JSON.stringify({
                    message: err.message,
                  })
                );
            }
          });
        };

        if (corsMiddleware) {
          return async function (req, res) {
            try {
              await (
                await corsMiddleware
              )(req, res, config.cors);

              await handler(req, res);
            } catch (err) /* istanbul ignore next */ {
              res
                .writeHead(500, {
                  'Content-Type': 'application/json',
                })
                .end(
                  JSON.stringify({
                    message: err.message,
                  })
                );
            }
          };
        }

        return handler;
      },
    });

    appPromise.then(handler => {
      app = handler.app;
    });

    return {
      async requestHandler(req, res) {
        try {
          await (app || (await appPromise).app)(req, res);
        } catch (err) /* istanbul ignore next */ {
          res
            .writeHead(500, {
              'content-type': 'application/json',
            })
            .end(
              JSON.stringify({
                message: err.message,
              })
            );
        }
      },
      getEnveloped: LazyPromise(() => appPromise.then(v => v.getEnveloped)),
    };
  }

  return {
    ...commonApp,
    buildApp,
  };
}

export interface GraphiQLHandlerOptions extends RenderGraphiQLOptions {}

const GraphiQLDeps = LazyPromise(async () => {
  const { renderGraphiQL } = await import('graphql-helix/dist/render-graphiql.js');

  return { renderGraphiQL };
});

export function GraphiQLHandler(options: GraphiQLHandlerOptions = {}): RequestHandler {
  const { endpoint = '/graphql', ...renderOptions } = options;

  const html = GraphiQLDeps.then(({ renderGraphiQL }) => {
    return renderGraphiQL({ ...renderOptions, endpoint });
  });

  return async function (req, res) {
    if (req.method !== 'GET') return res.writeHead(404).end();

    res.setHeader('content-type', 'text/html');

    res.end(await html);
  };
}

export interface AltairHandlerOptions extends Omit<RenderOptions, 'baseURL'> {
  /**
   *  Request Path
   *
   * @default "/altair"
   */
  path?: string;
}

export function AltairHandler(options: AltairHandlerOptions = {}): AsyncRequestHandler {
  const { path = '/altair', endpointURL = '/graphql', ...renderOptions } = options;

  return RawAltairHandler({
    path,
    endpointURL,
    ...renderOptions,
  });
}

export { gql, getPathname };

export * from '@graphql-ez/core/base';
