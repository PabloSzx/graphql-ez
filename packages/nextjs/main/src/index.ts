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
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { EZCors, handleCors } from './cors';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    next?: {
      req: NextApiRequest;
      res: NextApiResponse;
    };
  }

  interface InternalAppBuildIntegrationContext {
    next?: NextHandlerContext;
  }
}

export interface NextHandlerContext {
  handlers: Array<
    (
      req: NextApiRequest,
      res: NextApiResponse
    ) => Promise<
      | {
          stop?: true;
        }
      | undefined
    >
  >;
}

export interface NextAppOptions extends AppOptions {
  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: NextApiRequest, res: NextApiResponse) => ProcessRequestOptions;

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
  readonly apiHandler: NextApiHandler;
  readonly getEnveloped: Promise<GetEnvelopedFn<unknown>>;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;
}

export * from 'graphql-ez';
export type { NextApiHandler } from 'next';

export function CreateApp(config: NextAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  appConfig.path ||= '/api/graphql';

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'nextjs',
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

    let appHandler: NextApiHandler;
    const appPromise = Promise.allSettled([
      appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
        const nextHandlers: NextHandlerContext['handlers'] = [];

        const integration: InternalAppBuildIntegrationContext = {
          next: {
            handlers: nextHandlers,
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

        const EZHandler: NextApiHandler = async function EZHandler(req, res) {
          if (nextHandlers.length) {
            const result = await Promise.all(nextHandlers.map(cb => cb(req, res)));

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
                next: {
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
