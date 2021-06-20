import querystring from 'querystring';

import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildContext,
} from '@graphql-ez/core-app';
import { getPathname } from '@graphql-ez/core-utils/url';

import type { ServerResponse, IncomingMessage, Server as HTTPServer } from 'http';

import type { Envelop } from '@envelop/types';

declare module '@graphql-ez/core-types' {
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
      pathname: string,
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
   * Custom on app register callback with access to internal build context
   */
  onAppRegister?(ctx: InternalAppBuildContext, httpCtx: HTTPHandlerContext): void | Promise<void>;
}

export type AsyncRequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export interface EZApp {
  requestHandler: AsyncRequestHandler;
  getEnveloped: Envelop<unknown>;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options: BuildAppOptions & { server: HTTPServer }): Promise<EZApp>;
}

export function CreateApp(config: HttpAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'http-new',
      },
      config,
      {}
    );
  } catch (err) {
    Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions) {
    const { buildContext, handleNotFound = true, customHandleRequest, onAppRegister } = config;

    const requestHandler = customHandleRequest || handleRequest;

    const handler: AsyncRequestHandler = async function (req, res) {
      const pathname = getPathname(req.url)!;

      for (const cb of httpHandlers) {
        const result = await cb(pathname, req, res);

        if (result?.stop) return;
      }

      if (pathname === path) {
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
      }

      if (handleNotFound) return res.writeHead(404).end();
    };

    const httpHandlers: HTTPHandlerContext['handlers'] = [];

    const { app, getEnveloped } = await appBuilder(buildOptions, async ({ ctx }) => {
      const httpCtx: HTTPHandlerContext = {
        handlers: httpHandlers,
        server: buildOptions.server,
      };
      if (onAppRegister) await onAppRegister(ctx, httpCtx);
      await onIntegrationRegister({
        http: httpCtx,
      });
      async function requestHandler(req: IncomingMessage, res: ServerResponse) {
        try {
          await handler(req, res);
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
      }

      return requestHandler;
    });

    return {
      requestHandler: await app,
      getEnveloped,
    };
  };

  return {
    ...commonApp,
    buildApp,
  };
}
