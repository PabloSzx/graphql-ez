import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  GetEnvelopedFn,
  handleRequest,
  InternalAppBuildIntegrationContext,
  ProcessRequestOptions,
} from 'graphql-ez';

import type { Request, ResponseToolkit, Plugin, Server, Lifecycle, RouteOptionsCors, RouteOptions } from '@hapi/hapi';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    hapi?: {
      request: Request;
      h: ResponseToolkit;
    };
  }

  interface InternalAppBuildIntegrationContext {
    hapi?: {
      server: Server;
      ideRouteOptions?: RouteOptions;
    };
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
   * Configure IDE route options
   */
  ideRouteOptions?: RouteOptions;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: Request, h: ResponseToolkit) => ProcessRequestOptions;
}

export interface EZApp {
  hapiPlugin: Plugin<{}>;
  getEnveloped: GetEnvelopedFn<unknown>;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): Promise<EZApp>;
}

export function CreateApp(config: HapiAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  const path = (appConfig.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'hapi',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions = {}) {
    const { app: registerApp, getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const { buildContext, onAppRegister, processRequestOptions } = appConfig;

      return async function register(server: Server) {
        const integration: InternalAppBuildIntegrationContext = {
          hapi: { server, ideRouteOptions: appConfig.ideRouteOptions },
        };

        if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

        await onIntegrationRegister(integration);

        const requestHandler = ctx.options.customHandleRequest || handleRequest;

        server.route({
          path,
          method: ['GET', 'POST'],
          options: {
            cors: appConfig.cors,
            ...appConfig.routeOptions,
          },
          async handler(req, h) {
            const request = {
              body: req.payload,
              headers: req.headers,
              method: req.method,
              query: req.query,
            };

            const rawReq = req.raw.req;
            return requestHandler<Lifecycle.ReturnValueTypes>({
              request,
              req: rawReq,
              getEnveloped,
              baseOptions: appConfig,
              buildContext,
              contextArgs() {
                return {
                  req: rawReq,
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
                await defaultHandle(rawReq, req.raw.res, result);

                return h.abandon;
              },
              async onPushResponse(result, defaultHandle) {
                await defaultHandle(rawReq, req.raw.res, result);

                return h.abandon;
              },
              processRequestOptions: processRequestOptions && (() => processRequestOptions(req, h)),
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

export * from 'graphql-ez';
