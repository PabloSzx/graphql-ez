import bodyParser from 'koa-bodyparser';

import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildContext,
} from '@graphql-ez/core-app';

import type { Request, Response, default as KoaApp } from 'koa';
import type { Options as CorsOptions } from '@koa/cors';
import type { Envelop } from '@envelop/types';
import type * as KoaRouter from '@koa/router';

declare module '@graphql-ez/core-types' {
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
   * Custom on app register callback with access to internal build context
   */
  onAppRegister?(ctx: InternalAppBuildContext, router: KoaRouter): void | Promise<void>;
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
        integrationName: 'koa-new',
      },
      config,
      {}
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
      } = config;

      if (onAppRegister) await onAppRegister(ctx, router);

      await onIntegrationRegister({
        koa: { router, app: buildOptions.app },
      });

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

        return requestHandler({
          request,
          baseOptions: config,
          buildContext,
          buildContextArgs() {
            return {
              req: ctx.req,
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
            return defaultHandle(ctx.req, ctx.res, result);
          },
          onPushResponse(result, defaultHandle) {
            return defaultHandle(ctx.req, ctx.res, result);
          },
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

export * from '@graphql-ez/core-app';
export * from '@graphql-ez/core-utils';
