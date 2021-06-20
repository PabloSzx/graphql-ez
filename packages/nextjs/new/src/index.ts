import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildContext,
  LazyPromise,
} from '@graphql-ez/core-app';

import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import type { Envelop } from '@envelop/types';

declare module '@graphql-ez/core-types' {
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
   * Custom on app register callback with access to internal build context
   */
  onAppRegister?(ctx: InternalAppBuildContext, httpCtx: NextHandlerContext): void | Promise<void>;

  /**
   * By default it calls `console.error` and `process.exit(1)`
   */
  onBuildPromiseError?(err: unknown): unknown | never | void;
}

export interface EZApp {
  apiHandler: NextApiHandler;
  getEnveloped: Promise<Envelop>;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): EZApp;
}

export function CreateApp(config: NextAppOptions = {}): EZAppBuilder {
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

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions = {}) {
    const {
      buildContext,
      customHandleRequest,
      onAppRegister,
      onBuildPromiseError = err => {
        console.error(err);
        process.exit(1);
      },
    } = config;

    const requestHandler = customHandleRequest || handleRequest;

    let appHandler: NextApiHandler;
    const appPromise = appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const nextHandlers: NextHandlerContext['handlers'] = [];

      const nextCtx: NextHandlerContext = {
        handlers: nextHandlers,
      };
      if (onAppRegister) await onAppRegister(ctx, nextCtx);
      await onIntegrationRegister({
        next: nextCtx,
      });

      const EZHandler: NextApiHandler = async function EZHandler(req, res) {
        if (nextHandlers.length) {
          const result = await Promise.all(nextHandlers.map(cb => cb(req, res)));

          if (result.some(v => v?.stop)) return;
        }

        const request = {
          body: req.body,
          headers: req.headers,
          method: req.method!,
          query: req.query,
        };

        return requestHandler({
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
          onResponse(result) {
            res.status(result.status).json(result.payload);
          },
          onMultiPartResponse(result, defaultHandle) {
            return defaultHandle(req, res, result);
          },
          onPushResponse(result, defaultHandle) {
            return defaultHandle(req, res, result);
          },
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

export * from '@graphql-ez/core-app';
export * from '@graphql-ez/core-utils';
