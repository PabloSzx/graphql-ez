import querystring from 'querystring';

import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  Envelop,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildIntegrationContext,
  LazyPromise,
  ProcessRequestOptions,
} from 'graphql-ez';
import { getPathname } from 'graphql-ez/utils/url';

import type { ServerResponse, IncomingMessage, Server as HTTPServer } from 'http';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    http?: {
      request: IncomingMessage;
      response: ServerResponse;
    };
  }

  interface InternalAppBuildIntegrationContext {
    http?: HTTPHandlerContext;
  }
}

export interface HTTPHandlerContext {
  handlers: Array<
    (
      req: IncomingMessage,
      res: ServerResponse
    ) => Promise<
      | {
          stop?: true;
        }
      | undefined
    >
  >;
  server: HTTPServer;
}

export interface HttpAppOptions extends AppOptions {
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

  /**
   * By default it calls `console.error` and `process.exit(1)`
   */
  onBuildPromiseError?(err: unknown): unknown | never | void;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: IncomingMessage, res: ServerResponse) => ProcessRequestOptions;
}

export type AsyncRequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export interface EZApp {
  requestHandler: AsyncRequestHandler;
  getEnveloped: Promise<Envelop>;
}

export interface HTTPBuildAppOptions extends BuildAppOptions {
  server: HTTPServer;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options: HTTPBuildAppOptions): EZApp;
}

export function CreateApp(config: HttpAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'http',
      },
      config
    );
  } catch (err) {
    Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions) {
    const {
      buildContext,
      handleNotFound = true,
      customHandleRequest,
      onAppRegister,
      onBuildPromiseError = err => {
        console.error(err);
        process.exit(1);
      },
      processRequestOptions,
    } = config;

    const requestHandler = customHandleRequest || handleRequest;

    let appHandler: AsyncRequestHandler;
    const appPromise = appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const httpHandlers: HTTPHandlerContext['handlers'] = [];

      const integration: InternalAppBuildIntegrationContext = {
        http: {
          handlers: httpHandlers,
          server: buildOptions.server,
        },
      };

      if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

      await onIntegrationRegister(integration);

      const EZHandler: AsyncRequestHandler = async function (req, res) {
        if (httpHandlers.length) {
          const result = await Promise.all(httpHandlers.map(cb => cb(req, res)));

          if (result.some(v => v?.stop)) return;
        }

        if (getPathname(req.url) === path) {
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
                req,
                request,
                getEnveloped,
                baseOptions: config,
                contextArgs() {
                  return {
                    req,
                    http: {
                      request: req,
                      response: res,
                    },
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
                processRequestOptions: processRequestOptions && (() => processRequestOptions(req, res)),
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
        } else if (handleNotFound) {
          return res.writeHead(404).end();
        }
      };

      return (appHandler = EZHandler);
    }).catch(err => {
      onBuildPromiseError(err);

      throw err;
    });

    return {
      requestHandler: async function handler(req: IncomingMessage, res: ServerResponse) {
        try {
          await (appHandler || (await (await appPromise).app))(req, res);
        } catch (err) {
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
  };

  return {
    ...commonApp,
    buildApp,
  };
}

export * from 'graphql-ez';
