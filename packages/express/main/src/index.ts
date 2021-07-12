import { Express, json, Request, RequestHandler, Response, Router } from 'express';
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
import { getObjectValue } from 'graphql-ez/utils/object';

import type { Server as HttpServer } from 'http';
import type { OptionsJson as BodyParserOptions } from 'body-parser';
import type { CorsOptions, CorsOptionsDelegate } from 'cors';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    express?: {
      req: Request;
      res: Response;
    };
  }

  interface InternalAppBuildIntegrationContext {
    express?: {
      router: Router;
      app: Express;
      server?: HttpServer;
    };
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
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: Request, res: Response) => ProcessRequestOptions;
}

export interface EZApp {
  router: Router;
  getEnveloped: GetEnvelopedFn<unknown>;
}

export interface ExpressBuildAppOptions extends BuildAppOptions {
  app: Express;
  server?: HttpServer;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options: ExpressBuildAppOptions): Promise<EZApp>;
}

export function CreateApp(config: ExpressAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'express',
      },
      config
    );
  } catch (err) {
    Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions) {
    const { app: router, getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const router = Router();

      const {
        cors,
        bodyParserJSONOptions = {},
        customHandleRequest,
        buildContext,
        onAppRegister,
        processRequestOptions,
      } = config;

      const integration: InternalAppBuildIntegrationContext = {
        express: { router, app: buildOptions.app, server: buildOptions.server },
      };
      if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

      await onIntegrationRegister(integration);

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
          req,
          request,
          getEnveloped,
          baseOptions: config,
          contextArgs() {
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
          processRequestOptions: processRequestOptions && (() => processRequestOptions(req, res)),
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

export * from 'graphql-ez';
