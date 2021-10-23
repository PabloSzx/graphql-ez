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
import { useBody, useQuery } from 'h3';
import type { IncomingMessage, ServerResponse } from 'http';

export interface NuxtAppOptions extends AppOptions {}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;
}

export type NuxtApiHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

export interface EZApp {
  readonly getEnveloped: Promise<GetEnvelopedFn<unknown>>;
  readonly apiHandler: NuxtApiHandler;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export * from 'graphql-ez';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    nuxt?: {
      req: IncomingMessage;
      res: ServerResponse;
    };
  }

  interface InternalAppBuildIntegrationContext {
    nuxt?: NuxtHandlerContext;
  }
}

export interface NuxtHandlerContext {}

export function CreateApp(config: NuxtAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'nuxt',
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

    let appHandler: NuxtApiHandler;

    const appPromise = Promise.allSettled([
      appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
        const integration: InternalAppBuildIntegrationContext = {
          nuxt: {},
        };

        if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

        await onIntegrationRegister(integration);

        const {
          preProcessRequest,
          options: { customHandleRequest },
        } = ctx;

        const requestHandler = customHandleRequest || handleRequest;

        const EZHandler: NuxtApiHandler = async function EZHandler(req, res) {
          const request = {
            body: await useBody(req),
            headers: req.headers,
            method: req.method || 'POST',
            query: useQuery(req),
          };

          return requestHandler({
            req,
            request,
            getEnveloped,
            baseOptions: appConfig,
            contextArgs() {
              return {
                req,
                nuxt: {
                  req,
                  res,
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
            processRequestOptions: undefined,
            preProcessRequest,
          });
        };

        return (appHandler = EZHandler);
      }),
    ]).then(v => v[0]);

    return {
      apiHandler: async function handler(req, res) {
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
