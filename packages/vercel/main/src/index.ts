import type { VercelApiHandler, VercelRequest, VercelResponse } from '@vercel/node';
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
import { EZCors, handleCors } from './cors';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    vercel?: {
      req: VercelRequest;
      res: VercelResponse;
    };
  }

  interface InternalAppBuildIntegrationContext {
    vercel?: VercelHandlerContext;
  }
}

export interface VercelHandlerContext {
  handlers: Array<
    (
      req: VercelRequest,
      res: VercelResponse
    ) => Promise<
      | {
          stop?: true;
        }
      | undefined
    >
  >;
}

export interface VercelContextArgs extends BuildContextArgs {
  vercel: {
    req: VercelRequest;
    res: VercelResponse;
  };
}

export interface VercelAppOptions extends AppOptions {
  /**
   * Build Context
   */
  buildContext?: (args: any) => Record<string, unknown> | Promise<Record<string, unknown>>;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: VercelRequest, res: VercelResponse) => ProcessRequestOptions;

  /**
   * Enable/Customize CORS
   */
  cors?: EZCors;

  /**
   * The path of where the EZ App is being served,
   * it helps plugins like IDEs to know where to request the data
   *
   * @default "/api/graphql"
   */
  path?: string;
}

export interface EZApp {
  readonly apiHandler: VercelApiHandler;
  readonly getEnveloped: Promise<GetEnvelopedFn<unknown>>;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;
}

export type {
  VercelApiHandler,
  VercelRequest,
  VercelRequestBody,
  VercelRequestCookies,
  VercelRequestQuery,
  VercelResponse,
} from '@vercel/node';
export * from 'graphql-ez';

export function CreateApp(config: VercelAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  appConfig.path ||= '/api/graphql';

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'vercel',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions = {}) {
    const { buildContext, onAppRegister, processRequestOptions, cors } = appConfig;

    let appHandler: VercelApiHandler;
    const appPromise = Promise.allSettled([
      appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
        const handlers: VercelHandlerContext['handlers'] = [];

        const integration: InternalAppBuildIntegrationContext = {
          vercel: {
            handlers: handlers,
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

        const EZHandler: VercelApiHandler = async function EZHandler(req, res) {
          if (handlers.length) {
            const result = await Promise.all(handlers.map(cb => cb(req, res)));

            if (result.some(v => v?.stop)) return;
          }

          corsMiddleware && (await corsMiddleware(req, res));

          const request = {
            body: req.body,
            headers: req.headers,
            method: req.method!,
            query: req.query,
          };

          return requestHandler({
            req,
            request,
            getEnveloped,
            baseOptions: appConfig,
            contextArgs() {
              return {
                req,
                vercel: {
                  req,
                  res,
                },
              };
            },
            buildContext,
            onResponse(result) {
              for (const { name, value } of result.headers) {
                res.setHeader(name, value);
              }
              res.status(result.status).json(result.payload);
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
