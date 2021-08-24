import type { EndpointOutput, RequestHandler } from '@sveltejs/kit';
import type { ServerRequest, ServerResponse } from '@sveltejs/kit/types/hooks';
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
  LazyPromise,
} from 'graphql-ez';
import type { IncomingMessage } from 'http';

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;
}

export interface EZApp {
  readonly handler: RequestHandler;

  readonly getEnveloped: Promise<GetEnvelopedFn<unknown>>;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

declare module 'graphql-ez' {
  interface BuildContextArgs {
    sveltekit?: {
      req: ServerRequest;
    };
  }

  interface InternalAppBuildIntegrationContext {
    sveltekit?: SvelteKitHandlerContext;
  }
}

export interface SvelteKitHandlerContext {
  handlers: Array<(req: ServerRequest) => Promise<ServerResponse | null | undefined | void>>;
}

export function CreateApp(config: AppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

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
    const { buildContext, onAppRegister } = appConfig;

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

        const EZHandler: RequestHandler = async function EZHandler(req) {
          if (externalHandlers.length) {
            const result = await Promise.all(externalHandlers.map(cb => cb(req)));

            const firstResponse = result.find(v => v != null);

            if (firstResponse) return firstResponse;
          }

          const request = {
            headers: req.headers,
            method: req.method,
            query: Object.fromEntries(req.query),
            body: req.body,
          };

          const trapReq = new Proxy<IncomingMessage>(
            {
              headers: req.headers,
              method: req.method,
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

          return requestHandler<EndpointOutput>({
            request,
            req: trapReq,
            getEnveloped,
            baseOptions: appConfig,
            contextArgs() {
              return {
                req: trapReq,
                sveltekit: {
                  req,
                },
              };
            },
            buildContext,
            onResponse(result) {
              return {
                status: result.status,
                body: result.payload as Record<string, any>,
                headers: result.headers.reduce<Record<string, string>>((acum, { name, value }) => {
                  acum[name] = value;

                  return acum;
                }, {}),
              };
            },
            onMultiPartResponse() {
              throw Error('Not supported for sveltekit!');
            },
            onPushResponse() {
              throw Error('Not supported for sveltekit!');
            },
            preProcessRequest,
            processRequestOptions() {
              // TODO
              return {};
            },
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
