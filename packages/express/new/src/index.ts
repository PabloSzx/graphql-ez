import { json, Request, RequestHandler, Response, Router } from 'express';

import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildContext,
} from '@graphql-ez/core-app';
import { getObjectValue } from '@graphql-ez/core-utils/object';

import type { OptionsJson as BodyParserOptions } from 'body-parser';
import type { CorsOptions, CorsOptionsDelegate } from 'cors';
import type { Envelop } from '@envelop/types';

declare module '@graphql-ez/core-types' {
  interface BuildContextArgs {
    express?: {
      req: Request;
      res: Response;
    };
  }

  interface InternalAppBuildIntegrationContext {
    expressRouter?: Router;
  }
}

export interface ExpressAppOptions extends AppOptions {
  path?: string;

  /**
   * JSON body-parser options
   */
  bodyParserJSONOptions?: BodyParserOptions | boolean;

  /**
   * Enable or configure CORS
   */
  cors?: boolean | CorsOptions | CorsOptionsDelegate;

  /**
   * Custom on app register callback with access to internal build context
   */
  onAppRegister?(ctx: InternalAppBuildContext, router: Router): void | Promise<void>;
}

export interface EZApp {
  router: Router;
  getEnveloped: Envelop;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): Promise<EZApp>;
}

export function CreateApp(config: ExpressAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'express-new',
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
    const { app: router, getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const router = Router();

      const { cors, bodyParserJSONOptions, customHandleRequest, buildContext, onAppRegister } = config;

      if (onAppRegister) await onAppRegister(ctx, router);

      await onIntegrationRegister({
        expressRouter: router,
      });

      if (cors) {
        const corsMiddleware = (await import('cors')).default;
        router.use(corsMiddleware(getObjectValue(cors)));
      }

      if (bodyParserJSONOptions) router.use(json(getObjectValue(bodyParserJSONOptions)));

      const requestHandler = customHandleRequest || handleRequest;

      const ExpressRequestHandler: RequestHandler = (req, res, next) => {
        const request = {
          body: req.body,
          headers: req.headers,
          method: req.method,
          query: req.query,
        };

        return requestHandler({
          request,
          getEnveloped,
          baseOptions: config,
          buildContextArgs() {
            return {
              req,
              express: {
                req,
                res,
              },
            };
          },
          buildContext,
          onResponse(result) {
            res.type('application/json');
            res.status(result.status);
            res.json(result.payload);
          },
          onMultiPartResponse(result, defaultHandle) {
            return defaultHandle(req, res, result);
          },
          onPushResponse(result, defaultHandle) {
            return defaultHandle(req, res, result);
          },
        }).catch(next);
      };

      router.get(path, ExpressRequestHandler).post(path, ExpressRequestHandler);

      return router;
    });

    return {
      router: await router,
      getEnveloped,
    };
  };

  return {
    ...commonApp,
    buildApp,
  };
}

export * from '@graphql-ez/core-app';
export * from '@graphql-ez/core-utils';
