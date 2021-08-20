import type { Options as CorsOptions } from '@koa/cors';
import type * as KoaRouter from '@koa/router';
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
import type { default as KoaApp, Request, Response } from 'koa';
import bodyParser from 'koa-bodyparser';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    koa?: {
      request: Request;
      response: Response;
    };
  }

  interface InternalAppBuildIntegrationContext {
    koa?: {
      router: KoaRouter;
      app: KoaApp<any, any>;
    };
  }
}

export interface KoaAppOptions extends AppOptions {
  /**
   * @default "/graphql"
   */
  path?: string;

  /**
   * [koa-bodyparser](http://npm.im/koa-bodyparser) options
   */
  bodyParserOptions?: bodyParser.Options | false;

  /**
   * Enable CORS or configure it
   */
  cors?: boolean | CorsOptions;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: Request, res: Response) => ProcessRequestOptions;
}

export interface EZApp {
  getEnveloped: GetEnvelopedFn<unknown>;
}

export interface KoaBuildAppOptions extends BuildAppOptions {
  router: KoaRouter;
  app: KoaApp;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options: KoaBuildAppOptions): Promise<EZApp>;
}

export function CreateApp(config: KoaAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  const path = (appConfig.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'koa',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions) {
    const { getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const router = buildOptions.router;
      const {
        cors,
        onAppRegister,

        bodyParserOptions = {},
        buildContext,

        processRequestOptions,
      } = appConfig;

      const integration: InternalAppBuildIntegrationContext = {
        koa: { router, app: buildOptions.app },
      };

      if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

      await onIntegrationRegister(integration);

      if (cors) {
        const koaCors = (await import('@koa/cors')).default;

        router.use(koaCors(typeof appConfig.cors === 'boolean' ? undefined : appConfig.cors));
      }

      if (bodyParserOptions) router.use(bodyParser(bodyParserOptions));

      const {
        preProcessRequest,
        options: { customHandleRequest },
      } = ctx;

      const requestHandler = customHandleRequest || handleRequest;

      const main: KoaRouter.Middleware = ctx => {
        const request = {
          body: ctx.request.body,
          headers: ctx.request.headers,
          method: ctx.request.method,
          query: ctx.request.query,
        };

        const req = ctx.req;

        return requestHandler({
          req,
          request,
          baseOptions: appConfig,
          buildContext,
          contextArgs() {
            return {
              req,
              koa: {
                request: ctx.request,
                response: ctx.response,
              },
            };
          },
          getEnveloped,
          onResponse(result) {
            ctx.type = 'application/json';
            ctx.response.status = result.status;
            ctx.response.body = result.payload;
          },
          onMultiPartResponse(result, defaultHandle) {
            return defaultHandle(req, ctx.res, result);
          },
          onPushResponse(result, defaultHandle) {
            return defaultHandle(req, ctx.res, result);
          },
          processRequestOptions: processRequestOptions && (() => processRequestOptions(ctx.request, ctx.response)),
          preProcessRequest,
        });
      };

      router.get(path, main).post(path, main);
    });

    return {
      getEnveloped,
    };
  };

  return {
    ...commonApp,
    buildApp,
  };
}

export * from 'graphql-ez';
