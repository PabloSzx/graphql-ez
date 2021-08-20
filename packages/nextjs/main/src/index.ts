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
   * By default it calls `console.error` and `process.exit(1)`
   */
  onBuildPromiseError?(err: unknown): unknown | never | void;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: NextApiRequest, res: NextApiResponse) => ProcessRequestOptions;

  /**
   * Enable/Customize CORS
   */
  cors?: EZCors;
}

export interface EZApp {
  apiHandler: NextApiHandler;
  getEnveloped: Promise<GetEnvelopedFn<unknown>>;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): EZApp;
}

export * from 'graphql-ez';
export type { NextApiHandler } from 'next';

export function CreateApp(config: NextAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

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
    const {
      buildContext,
      onAppRegister,
      onBuildPromiseError = err => {
        console.error(err);
        process.exit(1);
      },
      processRequestOptions,
      cors,
    } = appConfig;

    let appHandler: NextApiHandler;
    const appPromise = appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
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
    }).catch(err => {
      onBuildPromiseError(err);

      throw err;
    });

    return {
      apiHandler: async function handler(req, res) {
        await (appHandler || (await (await appPromise).app))(req, res);
      },
      getEnveloped: LazyPromise(() => appPromise.then(v => v.getEnveloped)),
    };
  };

  return {
    ...commonApp,
    buildApp,
  };
}
