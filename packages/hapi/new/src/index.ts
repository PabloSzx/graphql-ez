import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildContext,
} from '@graphql-ez/core-app';

import type { Request, ResponseToolkit, Plugin, Server, Lifecycle, RouteOptionsCors, RouteOptions } from '@hapi/hapi';

import type { Envelop } from '@envelop/types';

declare module '@graphql-ez/core-types' {
  interface BuildContextArgs {
    hapi?: {
      request: Request;
      h: ResponseToolkit;
    };
  }

  interface InternalAppBuildIntegrationContext {
    hapiServer?: Server;
  }
}

export interface HapiAppOptions extends AppOptions {
  path?: string;

  /**
   * Enable CORS or configure it
   */
  cors?: boolean | RouteOptionsCors;

  /**
   * Configure main route options
   */
  routeOptions?: RouteOptions;

  /**
   * Custom on app register callback with access to internal build context
   */
  onAppRegister?(ctx: InternalAppBuildContext, server: Server): void | Promise<void>;
}

export interface EZApp {
  hapiPlugin: Plugin<{}>;
  getEnveloped: Envelop;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): Promise<EZApp>;
}

export function CreateApp(config: HapiAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'hapi-new',
      },
      config,
      {}
    );
  } catch (err) {
    Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions = {}) {
    const { app: registerApp, getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const { customHandleRequest, buildContext, onAppRegister } = config;

      return async function register(server: Server) {
        if (onAppRegister) await onAppRegister?.(ctx, server);
        await onIntegrationRegister({
          hapiServer: server,
        });

        const requestHandler = customHandleRequest || handleRequest;

        server.route({
          path,
          method: ['GET', 'POST'],
          options: {
            cors: config.cors,
            ...config.routeOptions,
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
    });

    return {
      hapiPlugin: {
        name: 'EZApp',
        async register(server) {
          await (
            await registerApp
          )(server);
        },
      },
      getEnveloped,
    };
  };

  return {
    ...commonApp,
    buildApp,
  };
}
