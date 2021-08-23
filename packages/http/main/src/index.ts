import { getPathname } from '@graphql-ez/utils/url';
import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  GetEnvelopedFn,
  handleRequest,
  InternalAppBuildIntegrationContext,
  LazyPromise,
  ProcessRequestOptions,
  InternalAppBuildContextKey,
  InternalAppBuildContext,
} from 'graphql-ez';
import type { IncomingMessage, Server as HTTPServer, ServerResponse } from 'http';
import querystring from 'querystring';
import { EZCors, handleCors } from './cors';

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
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: IncomingMessage, res: ServerResponse) => ProcessRequestOptions;

  /**
   * Enable/Customize CORS
   */
  cors?: EZCors;
}

export type AsyncRequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export interface EZApp {
  readonly requestHandler: AsyncRequestHandler;
  readonly getEnveloped: Promise<GetEnvelopedFn<unknown>>;

  readonly path: string;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface HTTPBuildAppOptions extends BuildAppOptions {
  server: HTTPServer;
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options: HTTPBuildAppOptions) => EZApp;

  readonly path: string;
}

export function CreateApp(config: HttpAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  const path = (appConfig.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'http',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions) {
    const { buildContext, handleNotFound = true, onAppRegister, processRequestOptions, cors } = appConfig;

    let appHandler: AsyncRequestHandler | undefined;
    const appPromise = Promise.allSettled([
      appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
        const httpHandlers: HTTPHandlerContext['handlers'] = [];

        const integration: InternalAppBuildIntegrationContext = {
          http: {
            handlers: httpHandlers,
            server: buildOptions.server,
          },
        };

        if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

        await onIntegrationRegister(integration);

        const corsMiddleware = await handleCors(cors);

        const {
          preProcessRequest,
          options: { customHandleRequest },
        } = ctx;

        const requestHandler = customHandleRequest || handleRequest;

        const EZHandler: AsyncRequestHandler = async function (req, res) {
          if (httpHandlers.length) {
            const result = await Promise.all(httpHandlers.map(cb => cb(req, res)));

            if (result.some(v => v?.stop)) return;
          }

          if (getPathname(req.url) === path) {
            corsMiddleware && (await corsMiddleware(req, res));

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
                  baseOptions: appConfig,
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
                  preProcessRequest,
                });
              } catch (err) /* istanbul ignore next */ {
                res
                  .writeHead(500, {
                    'Content-Type': 'application/json',
                  })
                  .end(
                    JSON.stringify({
                      message: err instanceof Error ? err.message : 'Unexpected Error',
                    })
                  );
              }
            });
          } else if (handleNotFound) {
            return res.writeHead(404).end();
          }
        };

        return (appHandler = EZHandler);
      }),
    ]).then(v => v[0]);

    return {
      requestHandler: async function handler(req: IncomingMessage, res: ServerResponse) {
        try {
          if (appHandler) {
            await appHandler(req, res);
          } else {
            const result = await appPromise;
            if (result.status === 'rejected')
              throw Error(
                process.env.NODE_ENV === 'development'
                  ? 'Error while building EZ App: ' + (result.reason?.message || JSON.stringify(result.reason))
                  : 'Unexpected Error'
              );

            await (
              await result.value.app
            )(req, res);
          }
        } catch (err) {
          res
            .writeHead(500, {
              'content-type': 'application/json',
            })
            .end(
              JSON.stringify({
                message: err instanceof Error ? err.message : 'Unexpected Error',
              })
            );
        }
      },
      getEnveloped: LazyPromise(async () => {
        const result = await appPromise;
        if (result.status === 'rejected') throw result.reason;
        return result.value.getEnveloped;
      }),
      path,
      ready: LazyPromise(async () => {
        const result = await appPromise;
        if (result.status === 'rejected') throw result.reason;
      }),
      [InternalAppBuildContextKey]: commonApp[InternalAppBuildContextKey],
    };
  };

  return {
    ...commonApp,
    buildApp,
    path,
  };
}

export * from 'graphql-ez';
