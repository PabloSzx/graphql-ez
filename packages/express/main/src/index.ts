import { getObjectValue } from '@graphql-ez/utils/object';
import type { OptionsJson as BodyParserOptions } from 'body-parser';
import type { CorsOptions, CorsOptionsDelegate } from 'cors';
import { Application, json, Request, RequestHandler, Response, Router } from 'express';
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
  InternalAppBuildContextKey,
  InternalAppBuildContext,
} from 'graphql-ez';
import type { Server as HttpServer } from 'http';

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
      app: Application;
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
  readonly router: Router;
  readonly getEnveloped: GetEnvelopedFn<unknown>;
  readonly path: string;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface ExpressBuildAppOptions extends BuildAppOptions {
  app: Application;
  server?: HttpServer;
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options: ExpressBuildAppOptions) => Promise<EZApp>;
  readonly path: string;
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
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions) {
    const { app: router, getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const router = Router();

      const { cors, bodyParserJSONOptions = {}, buildContext, onAppRegister, processRequestOptions } = config;

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

      const {
        preProcessRequest,
        options: { customHandleRequest },
      } = ctx;

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
            for (const { name, value } of result.headers) {
              res.setHeader(name, value);
            }

            res.status(result.status);
            res.send(result.payload);
          },
          onMultiPartResponse(result, defaultHandle) {
            return defaultHandle(req, res, result);
          },
          onPushResponse(result, defaultHandle) {
            return defaultHandle(req, res, result);
          },
          processRequestOptions: processRequestOptions && (() => processRequestOptions(req, res)),
          preProcessRequest,
        }).catch(next);
      };

      router.get(path, ExpressRequestHandler).post(path, ExpressRequestHandler);

      return router;
    });

    return {
      router: await router,
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
