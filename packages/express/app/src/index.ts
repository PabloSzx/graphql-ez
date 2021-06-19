import assert from 'assert';
import { Express, json, Request, RequestHandler, Response, Router } from 'express';
import { createServer, Server } from 'http';

import { BaseEZAppOptions, BaseEnvelopBuilder, createEZAppFactory, handleRequest } from '@graphql-ez/core/app';
import { handleCodegen, WithCodegen } from '@graphql-ez/core/codegen/handle';
import { handleIDE, WithIDE } from '@graphql-ez/core/ide/handle';
import { handleJit, WithJit } from '@graphql-ez/core/jit';
import { CreateWebSocketsServer, WithWebSockets } from '@graphql-ez/core/websockets/handle';

import type { CorsOptions, CorsOptionsDelegate } from 'cors';
import type { Envelop } from '@envelop/types';
import type { EnvelopContext } from '@graphql-ez/core/types';
import type { OptionsJson as BodyParserOptions } from 'body-parser';
import type { WithGraphQLUpload } from '@graphql-ez/core/upload';

declare module '@graphql-ez/core/types' {
  interface BuildContextArgs {
    express?: {
      req: Request;
      res: Response;
    };
  }
}

export interface EZAppOptions
  extends BaseEZAppOptions<EnvelopContext>,
    WithCodegen,
    WithJit,
    WithWebSockets,
    WithIDE,
    WithGraphQLUpload {
  /**
   * @default "/graphql"
   */
  path?: string;

  /**
   * JSON body-parser options
   */
  bodyParserJSONOptions?: BodyParserOptions | boolean;

  /**
   * Enable or configure CORS
   */
  cors?: boolean | CorsOptions | CorsOptionsDelegate;
}

export interface BuildAppOptions {
  app: Express;
  server?: Server;
  prepare?: (appBuilder: BaseEnvelopBuilder) => void | Promise<void>;
}

export interface EZApp {
  router: Router;
  getEnveloped: Envelop<unknown>;
}

export interface EZAppBuilder extends BaseEnvelopBuilder {
  buildApp(options: BuildAppOptions): Promise<EZApp>;
}

export function CreateApp(config: EZAppOptions = {}): EZAppBuilder {
  const { appBuilder, ...commonApp } = createEZAppFactory(config, {
    async preBuild(plugins) {
      await handleJit(config, plugins);
    },
    afterBuilt(getEnveloped) {
      handleCodegen(getEnveloped, config, {
        moduleName: 'express',
      });
    },
  });

  const { path = '/graphql', websockets, customHandleRequest } = config;

  const websocketsFactoryPromise = CreateWebSocketsServer(config);

  async function handleSubscriptions(getEnveloped: Envelop<unknown>, appInstance: Express, optionsServer: Server | undefined) {
    if (!websockets) return;

    const websocketsHandler = await websocketsFactoryPromise;
    assert(websocketsHandler);

    const handleUpgrade = websocketsHandler(getEnveloped);

    const server = optionsServer || createServer(appInstance);

    appInstance.listen = (...args: any[]) => {
      return server.listen(...args);
    };

    const state = handleUpgrade(server, path);

    const oldClose = server.close;
    server.close = function (cb) {
      state.closing = true;

      oldClose.call(this, cb);

      for (const wsServer of state.wsServers) {
        for (const client of wsServer.clients) {
          client.close();
        }
        wsServer.close();
      }

      return server;
    };
  }

  async function buildApp({ prepare, app, server }: BuildAppOptions): Promise<EZApp> {
    const { buildContext, path = '/graphql', bodyParserJSONOptions: jsonOptions = {}, ide, cors } = config;
    const { app: router, getEnveloped } = await appBuilder({
      prepare,
      async adapterFactory(getEnveloped) {
        const EZApp = Router();

        if (cors) {
          const corsMiddleware = (await import('cors')).default;
          EZApp.use(corsMiddleware(typeof cors !== 'boolean' ? cors : undefined));
        }

        if (jsonOptions) EZApp.use(json(typeof jsonOptions === 'object' ? jsonOptions : undefined));

        const IDEPromise = handleIDE(ide, path, {
          async handleAltair(ideOptions) {
            const { altairExpress } = await import('altair-express-middleware');

            EZApp.use(ideOptions.path, altairExpress(ideOptions));
          },
          handleGraphiQL({ path, html }) {
            EZApp.use(path, (_req, res) => {
              res.type('html').send(html);
            });
          },
        });

        const subscriptionsPromise = handleSubscriptions(getEnveloped, app, server);

        const requestHandler = customHandleRequest || handleRequest;

        const ExpressRequestHandler: RequestHandler = (req, res, next) => {
          const request = {
            body: req.body,
            headers: req.headers,
            method: req.method,
            query: req.query,
          };

          return requestHandler({
            request,
            getEnveloped,
            baseOptions: config,
            buildContextArgs() {
              return {
                req,
                express: {
                  req,
                  res,
                },
              };
            },
            buildContext,
            onResponse(result) {
              res.type('application/json');
              res.status(result.status);
              res.json(result.payload);
            },
            onMultiPartResponse(result, defaultHandle) {
              return defaultHandle(req, res, result);
            },
            onPushResponse(result, defaultHandle) {
              return defaultHandle(req, res, result);
            },
          }).catch(next);
        };

        EZApp.get(path, ExpressRequestHandler);
        if (config.GraphQLUpload) {
          const GraphQLUploadMiddleware: typeof import('graphql-upload').graphqlUploadExpress = (
            await import('graphql-upload/public/graphqlUploadExpress.js')
          ).default;

          const middleware = GraphQLUploadMiddleware(typeof config.GraphQLUpload === 'object' ? config.GraphQLUpload : undefined);

          EZApp.post(path, middleware, ExpressRequestHandler);
        } else {
          EZApp.post(path, ExpressRequestHandler);
        }

        await Promise.all([IDEPromise, subscriptionsPromise]);

        return EZApp;
      },
    });

    return {
      router: await router,
      getEnveloped,
    };
  }

  return {
    ...commonApp,
    buildApp,
  };
}

export * from '@graphql-ez/core/base';
