import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  EZContext,
  GetEnvelopedFn,
  handleRequest,
  InternalAppBuildContext,
  InternalAppBuildContextKey,
  LazyPromise,
  ProcessRequestOptions,
} from 'graphql-ez';
import type { InternalAppBuildIntegrationContext } from 'graphql-yoga';
import type { IncomingMessage } from 'http';
import { Handler, Router } from 'worktop';
import type { ServerRequest } from 'worktop/request';
import type { ServerResponse } from 'worktop/response';

export interface WorktopAppOptions extends AppOptions {
  processRequestOptions?: (req: ServerRequest, res: ServerResponse) => ProcessRequestOptions;
}

export interface EZApp {
  readonly router: Router;
  readonly getEnveloped: Promise<GetEnvelopedFn<EZContext>>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export * from 'graphql-ez';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    cloudflare?: {
      req: ServerRequest;
      res: ServerResponse;
    };
  }

  interface InternalAppBuildIntegrationContext {
    cloudflare?: {
      router: Router;
    };
  }
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;
}

export function CreateApp(config: WorktopAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'cloudflare',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions = {}) {
    const { buildContext, onAppRegister, processRequestOptions } = appConfig;

    const router = new Router();

    let ezHandler: Handler | undefined;

    const appPromise = Promise.allSettled([
      appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
        const integration: InternalAppBuildIntegrationContext = {
          cloudflare: {
            router,
          },
        };

        if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

        await onIntegrationRegister(integration);

        const {
          preProcessRequest,
          options: { customHandleRequest },
        } = ctx;

        const requestHandler = customHandleRequest || handleRequest;

        const handler: Handler = async (req, res) => {
          const headers = Object.fromEntries(req.headers.entries());
          const request = {
            body: req.method === 'POST' ? await req.body.json() : undefined,
            headers,
            method: req.method,
            query: req.method === 'GET' ? Object.fromEntries(req.query) : undefined,
          };

          const trapReq = new Proxy<IncomingMessage>(
            {
              headers,
              method: req.method,
              url: req.url,
            } as IncomingMessage,
            {
              get(target, key) {
                switch (key) {
                  case 'url':
                  case 'headers':
                  case 'method': {
                    return target[key];
                  }
                }
                throw Error('Property not available for Cloudflare workers!');
              },
            }
          );

          return requestHandler({
            req: trapReq,
            request,
            getEnveloped,
            baseOptions: config,
            contextArgs() {
              return {
                req: trapReq,
                cloudflare: {
                  req,
                  res,
                },
              };
            },
            buildContext,
            onResponse(result) {
              res.send(
                result.status,
                result.payload,
                result.headers.reduce<Record<string, string>>((acum, { name, value }) => {
                  acum[name] = value;

                  return acum;
                }, {})
              );
            },
            onMultiPartResponse() {
              throw Error('Not supported');
            },
            onPushResponse() {
              throw Error('Not supported');
            },
            processRequestOptions: processRequestOptions && (() => processRequestOptions(req, res)),
            preProcessRequest,
          });
        };

        return (ezHandler = handler);
      }),
    ]).then(v => v[0]);

    const routerHandler: Handler = async (req, res) => {
      if (ezHandler) {
        return ezHandler(req, res);
      }

      const result = await appPromise;
      if (result.status === 'rejected')
        throw Error('Error while building EZ App: ' + (result.reason?.message || JSON.stringify(result.reason)));

      await (
        await result.value.app
      )(req, res);
    };

    router.add('GET', '/graphql', routerHandler);

    router.add('POST', '/graphql', routerHandler);

    return {
      router,
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
