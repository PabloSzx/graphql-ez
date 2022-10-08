import type { RequestHandler, RequestEvent } from '@sveltejs/kit';
import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  BuildContextArgs,
  createEZAppFactory,
  EZAppFactoryType,
  GetEnvelopedFn,
  handleRequest,
  InternalAppBuildContext,
  InternalAppBuildContextKey,
  InternalAppBuildIntegrationContext,
  LazyPromise,
  ProcessRequestOptions,
} from 'graphql-ez';
import type { IncomingMessage } from 'http';

type RequestHandlerResponse = Awaited<ReturnType<RequestHandler>>;

type ResponseHeaders = Record<string, string>;

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;
}

export * from 'graphql-ez';

export interface EZApp {
  readonly handler: RequestHandler;

  readonly getEnveloped: Promise<GetEnvelopedFn<unknown>>;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface SvelteKitContextArgs extends BuildContextArgs {
  sveltekit: {
    req: RequestEvent;
    responseHeaders: ResponseHeaders;
  };
}

declare module 'graphql-ez' {
  interface BuildContextArgs {
    sveltekit?: {
      req: RequestEvent;
      responseHeaders: ResponseHeaders;
    };
  }

  interface InternalAppBuildIntegrationContext {
    sveltekit?: SvelteKitHandlerContext;
  }
}

export interface SvelteKitHandlerContext {
  handlers: Array<(req: RequestEvent) => ReturnType<RequestHandler> | undefined | null>;
}

export interface SvelteKitAppOptions extends AppOptions {
  /**
   * Build Context
   */
  buildContext?: (args: any) => Record<string, unknown> | Promise<Record<string, unknown>>;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: RequestEvent) => ProcessRequestOptions;

  /**
   * The path of where the EZ App is being served.
   *
   * If it's not specified, it's assumed that is should be served on any path.
   */
  path?: string;
}

export function CreateApp(config: SvelteKitAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  const path = appConfig.path;

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'sveltekit',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions = {}) {
    const { buildContext, onAppRegister, processRequestOptions } = appConfig;

    let appHandler: RequestHandler | undefined;

    const externalHandlers: SvelteKitHandlerContext['handlers'] = [];

    const appPromise = Promise.allSettled([
      appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
        const integration: InternalAppBuildIntegrationContext = {
          sveltekit: {
            handlers: externalHandlers,
          },
        };

        if (onAppRegister)
          await onAppRegister({
            ctx,
            integration,
            getEnveloped,
          });

        await onIntegrationRegister(integration);

        const {
          preProcessRequest,
          options: { customHandleRequest },
        } = ctx;

        const requestHandler = customHandleRequest || handleRequest;

        const hasHandlers = !!externalHandlers.length;

        const EZHandler: RequestHandler = async function EZHandler(req): Promise<RequestHandlerResponse> {
          if (hasHandlers) {
            const result = await Promise.all(externalHandlers.map(cb => cb(req)));

            for (const response of result) if (response != null) return response;
          }

          if (path && req.url.pathname !== path) {
            return new Response(null, {
              status: 404,
            });
          }

          const headers = Object.fromEntries(req.request.headers);

          const method = req.request.method;

          const request = {
            headers,
            method,
            query: Object.fromEntries(req.url.searchParams),
            body: req.request.body && (await req.request.json().catch(() => null)),
          };

          const trapReq = new Proxy<IncomingMessage>(
            {
              headers,
              method,
            } as IncomingMessage,
            {
              get(target, key) {
                switch (key) {
                  case 'headers':
                  case 'method': {
                    return target[key];
                  }
                }
                throw Error('Property not available for SvelteKit');
              },
            }
          );

          const responseHeaders: ResponseHeaders = {};

          return requestHandler({
            request,
            req: trapReq,
            getEnveloped,
            baseOptions: appConfig,
            contextArgs() {
              return {
                req: trapReq,
                sveltekit: {
                  req,
                  responseHeaders,
                },
              };
            },
            buildContext,
            onResponse(result) {
              for (const { name, value } of result.headers) {
                responseHeaders[name] = value;
              }

              return new Response(JSON.stringify(result.payload), {
                headers: responseHeaders,
                status: result.status,
              });
            },
            onMultiPartResponse() {
              throw Error('Not supported for SvelteKit!');
            },
            onPushResponse() {
              throw Error('Not supported for SvelteKit!');
            },
            preProcessRequest,
            processRequestOptions: processRequestOptions && (() => processRequestOptions(req)),
          });
        };

        return (appHandler = EZHandler);
      }),
    ]).then(v => v[0]);

    return {
      handler: async function handler(req) {
        if (appHandler) {
          return appHandler(req);
        }
        const result = await appPromise;
        if (result.status === 'rejected')
          throw Error(
            process.env.NODE_ENV === 'development'
              ? 'Error while building EZ App: ' + (result.reason?.message || JSON.stringify(result.reason))
              : 'Unexpected Error'
          );

        return (await result.value.app)(req);
      },
      getEnveloped: LazyPromise(async () => {
        const result = await appPromise;
        if (result.status === 'rejected') throw result.reason;
        return result.value.getEnveloped;
      }),
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
  };
}
