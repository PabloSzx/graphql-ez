import { getObjectValue } from '@graphql-ez/utils/object';
import type { App, AsyncHandler, Request, Response } from '@tinyhttp/app';
import type { AccessControlOptions } from '@tinyhttp/cors';
import type {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  EZAppFactoryType,
  GetEnvelopedFn,
  InternalAppBuildContext,
  InternalAppBuildIntegrationContext,
  ProcessRequestOptions,
} from 'graphql-ez';
import { createEZAppFactory, handleRequest, InternalAppBuildContextKey } from 'graphql-ez';

export * from 'graphql-ez';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    tinyhttp?: {
      req: Request;
      res: Response;
    };
  }

  interface InternalAppBuildIntegrationContext {
    tinyhttp?: {
      app: App;
    };
  }
}

export interface tinyhttpAppOptions extends AppOptions {
  /**
   * Specify main API path
   *
   * @default "/graphql"
   */
  path?: string;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: Request, res: Response) => ProcessRequestOptions;

  /**
   * Parse JSON body using [milliparsec](https://www.npmjs.com/package/milliparsec)
   * @default true
   */
  json?: boolean;

  /**
   * Enable or configure CORS
   */
  cors?: boolean | AccessControlOptions;
}

export interface EZApp {
  readonly app: App;
  readonly getEnveloped: GetEnvelopedFn<unknown>;
  readonly path: string;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface tinyhttpBuildAppOptions extends BuildAppOptions {
  app: App;
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options: tinyhttpBuildAppOptions) => Promise<EZApp>;
  readonly path: string;
}

export function CreateApp(config: tinyhttpAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'tinyhttp',
      },
      config
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = async function buildApp(buildOptions) {
    const { app, getEnveloped } = await appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
      const { app } = buildOptions;

      const { buildContext, onAppRegister, processRequestOptions, json = true, cors } = config;

      const integration: InternalAppBuildIntegrationContext = {
        tinyhttp: {
          app,
        },
      };

      if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

      await onIntegrationRegister(integration);

      const {
        preProcessRequest,
        options: { customHandleRequest },
      } = ctx;

      const requestHandler = customHandleRequest || handleRequest;

      if (cors) {
        const corsOptions = getObjectValue(cors);

        const { cors: tinyCors } = await import('@tinyhttp/cors');

        app.use(tinyCors(corsOptions)).options('*', tinyCors(corsOptions));
      }

      const tinyhttpRequestHandler: AsyncHandler = async (req, res) => {
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
          baseOptions: config,
          contextArgs() {
            return {
              req,
              tinyhttp: {
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
        });
      };

      app.get(path, tinyhttpRequestHandler);

      if (json) {
        app.post(path, (await import('milliparsec')).json(), tinyhttpRequestHandler);
      } else {
        app.post(path, tinyhttpRequestHandler);
      }

      return app;
    });

    return {
      app: await app,
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
