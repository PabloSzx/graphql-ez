import type {
  HandlerDecorations,
  Lifecycle,
  Plugin,
  Request,
  ResponseToolkit,
  RouteOptions,
  RouteOptionsCors,
  Server,
} from '@hapi/hapi';
import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  GetEnvelopedFn,
  handleRequest,
  InternalAppBuildContext,
  InternalAppBuildContextKey,
  InternalAppBuildIntegrationContext,
  ProcessRequestOptions,
  PromiseOrValue,
} from 'graphql-ez';

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
      preHandler: Array<(req: Request, h: ResponseToolkit) => PromiseOrValue<Lifecycle.Method | HandlerDecorations | undefined>>;
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
  readonly hapiPlugin: Plugin<unknown>;
  readonly getEnveloped: GetEnvelopedFn<unknown>;

  readonly path: string;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): Promise<EZApp>;

  readonly path: string;
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
    const { app: registerApp, getEnveloped } = await appBuilder(buildOptions, ({ ctx, getEnveloped }) => {
      const { buildContext, onAppRegister, processRequestOptions } = appConfig;

      return async function register(server: Server) {
        const preHandlerCtx: Array<
          (req: Request, h: ResponseToolkit) => PromiseOrValue<Lifecycle.Method | HandlerDecorations | undefined>
        > = [];

        const integration: InternalAppBuildIntegrationContext = {
          hapi: { server, ideRouteOptions: appConfig.ideRouteOptions, preHandler: preHandlerCtx },
        };

        if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

        await onIntegrationRegister(integration);

        const {
          preProcessRequest,
          options: { customHandleRequest },
        } = ctx;

        const requestHandler = customHandleRequest || handleRequest;

        const preHandler = preHandlerCtx.length ? preHandlerCtx : false;

        server.route({
          path,
          method: ['GET', 'POST'],
          options: {
            cors: appConfig.cors,
            ...appConfig.routeOptions,
          },
          async handler(req, h) {
            if (preHandler) {
              for (const handler of preHandler) {
                const result = await handler(req, h);

                if (result) return result;
              }
            }

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
                let responseObject = h.response(result.payload).code(result.status).type('application/json');
                for (const { name, value } of result.headers) {
                  responseObject = responseObject.header(name, value);
                }
                return responseObject;
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
              preProcessRequest,
            });
          },
        });
      };
    });

    return {
      hapiPlugin: {
        name: 'EZApp',
        async register(server) {
          await registerApp(server);
        },
      },
      getEnveloped,
      path,
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
