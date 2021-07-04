import bodyParser from 'koa-bodyparser';

import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  Envelop,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildIntegrationContext,
  ProcessRequestOptions,
} from 'graphql-ez';

import type { Request, Response, default as KoaApp } from 'koa';
import type { Options as CorsOptions } from '@koa/cors';
import type * as KoaRouter from '@koa/router';

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
  getEnveloped: Envelop;
}

export interface KoaBuildAppOptions extends BuildAppOptions {
  router: KoaRouter;
  app: KoaApp;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options: KoaBuildAppOptions): Promise<EZApp>;
}

export function CreateApp(config: KoaAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'koa',
      },
      config
    );
  } catch (err) {
    Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions) {
    const { getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const router = buildOptions.router;
      const {
        customHandleRequest,
        cors,
        onAppRegister,

        bodyParserOptions = {},
        buildContext,

        processRequestOptions,
      } = config;

      const integration: InternalAppBuildIntegrationContext = {
        koa: { router, app: buildOptions.app },
      };

      if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

      await onIntegrationRegister(integration);

      if (cors) {
        const koaCors = (await import('@koa/cors')).default;

        router.use(koaCors(typeof config.cors === 'boolean' ? undefined : config.cors));
      }

      if (bodyParserOptions) router.use(bodyParser(bodyParserOptions));

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
          baseOptions: config,
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
