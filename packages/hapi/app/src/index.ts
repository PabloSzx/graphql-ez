import { BaseEZAppOptions, BaseEnvelopBuilder, createEZAppFactory, handleRequest } from '@graphql-ez/core/app';
import { LazyPromise } from '@graphql-ez/core/base';
import { handleCodegen, WithCodegen } from '@graphql-ez/core/codegen/handle';
import { handleIDE, WithIDE } from '@graphql-ez/core/ide/handle';
import { RawAltairHandler } from '@graphql-ez/core/ide/rawAltair';
import { handleJit, WithJit } from '@graphql-ez/core/jit';

import type { EnvelopContext } from '@graphql-ez/core/types';
import type { Request, ResponseToolkit, Plugin, Server, Lifecycle, RouteOptionsCors, RouteOptions } from '@hapi/hapi';
import type { Envelop } from '@envelop/types';

declare module '@graphql-ez/core/types' {
  interface BuildContextArgs {
    hapi?: {
      request: Request;
      h: ResponseToolkit;
    };
  }
}

export interface EZAppOptions extends BaseEZAppOptions<EnvelopContext>, WithCodegen, WithJit, WithIDE {
  /**
   * @default "/graphql"
   */
  path?: string;

  /**
   * Enable CORS or configure it
   */
  cors?: boolean | RouteOptionsCors;

  /**
   * Configure main route options
   */
  mainRouteOptions?: RouteOptions;

  /**
   * Configure IDE route options
   */
  ideRouteOptions?: RouteOptions;
}

export interface BuildAppOptions {
  prepare?: (appBuilder: BaseEnvelopBuilder) => void | Promise<void>;
}

export interface EZApp {
  plugin: Plugin<{}>;
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
        moduleName: 'hapi',
      });
    },
  });

  function buildApp({ prepare }: BuildAppOptions = {}): EZApp {
    const { ide, path = '/graphql', buildContext, customHandleRequest } = config;

    const registerApp = appBuilder({
      prepare,
      adapterFactory(getEnveloped) {
        return async function register(server: Server) {
          await handleIDE(ide, path, {
            handleAltair({ path, ...renderOptions }) {
              const altairHandler = RawAltairHandler({
                path,
                ...renderOptions,
              });

              const basePath = path.endsWith('/') ? path.slice(0, path.length - 1) : path;

              const wildCardPath = `${basePath}/{any*}`;

              async function handler(req: Request, h: ResponseToolkit) {
                await altairHandler(req.raw.req, req.raw.res);

                return h.abandon;
              }

              server.route({
                path: wildCardPath,
                method: 'GET',
                handler,
                options: config.ideRouteOptions,
              });
            },
            handleGraphiQL({ path, html }) {
              server.route({
                path,
                method: 'GET',
                options: config.ideRouteOptions,
                handler(_req, h) {
                  return h.response(html).type('text/html');
                },
              });
            },
          });

          const requestHandler = customHandleRequest || handleRequest;

          server.route({
            path,
            method: ['GET', 'POST'],
            options: {
              cors: config.cors,
              ...config.mainRouteOptions,
            },
            async handler(req, h) {
              const request = {
                body: req.payload,
                headers: req.headers,
                method: req.method,
                query: req.query,
              };

              return requestHandler<Lifecycle.ReturnValueTypes>({
                request,
                getEnveloped,
                baseOptions: config,
                buildContext,
                buildContextArgs() {
                  return {
                    req: req.raw.req,
                    hapi: {
                      request: req,
                      h,
                    },
                  };
                },
                onResponse(result) {
                  return h.response(result.payload).code(result.status).type('application/json');
                },
                async onMultiPartResponse(result, defaultHandle) {
                  await defaultHandle(req.raw.req, req.raw.res, result);

                  return h.abandon;
                },
                async onPushResponse(result, defaultHandle) {
                  await defaultHandle(req.raw.req, req.raw.res, result);

                  return h.abandon;
                },
              });
            },
          });
        };
      },
    });

    return {
      plugin: {
        name: 'EZApp',
        async register(server) {
          await (await registerApp).app(server);
        },
      },
      getEnveloped: LazyPromise(() => registerApp.then(v => v.getEnveloped)),
    };
  }

  return {
    ...commonApp,
    buildApp,
  };
}

export * from '@graphql-ez/core/base';
