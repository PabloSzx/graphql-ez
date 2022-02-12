import {
  AppOptions,
  BaseAppBuilder,
  BuildAppOptions,
  createEZAppFactory,
  EZAppFactoryType,
  handleRequest,
  InternalAppBuildIntegrationContext,
  LazyPromise,
  ProcessRequestOptions,
  InternalAppBuildContextKey,
  InternalAppBuildContext,
} from 'graphql-ez';
import type { IncomingMessage } from 'http';

import type { ActionFunction } from 'remix';

type DataFunctionArgs = Parameters<ActionFunction>[0];

export interface RemixBuildContextArgs extends DataFunctionArgs {}

type ResponseHeaders = Record<string, string | number | string[]>;

declare module 'graphql-ez' {
  interface BuildContextArgs {
    remix?: DataFunctionArgs & { responseHeaders: ResponseHeaders };
  }

  interface InternalAppBuildIntegrationContext {
    remix?: RemixHandlerContext;
  }
}

export interface RemixHandlerContext {
  handlers: Array<(args: DataFunctionArgs) => Response | undefined | null | void>;
}

export interface RemixAppOptions extends AppOptions {
  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (args: DataFunctionArgs) => ProcessRequestOptions;

  /**
   * The path of where the EZ App is being served,
   * it helps plugins like IDEs to know where to request the data
   *
   * @default "/api/graphql"
   */
  path?: string;
}

export type RemixAPIHandler = (args: DataFunctionArgs) => Promise<Response>;

export interface EZApp {
  readonly action: RemixAPIHandler;
  readonly loader: RemixAPIHandler;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;
}

export * from 'graphql-ez';

export function CreateApp(config: RemixAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  appConfig.path ||= '/api/graphql';

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'remix',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions = {}) {
    const { buildContext, onAppRegister, processRequestOptions } = appConfig;

    let appHandler: RemixAPIHandler;

    const appPromise = Promise.allSettled([
      appBuilder(buildOptions, async ({ ctx, getEnveloped }) => {
        const remixHandlers: RemixHandlerContext['handlers'] = [];

        const integration: InternalAppBuildIntegrationContext = {
          remix: {
            handlers: remixHandlers,
          },
        };

        if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

        await onIntegrationRegister(integration);

        const {
          preProcessRequest,
          options: { customHandleRequest },
        } = ctx;

        const requestHandler = customHandleRequest || handleRequest;

        const EZHandler: RemixAPIHandler = async function EZHandler(args) {
          if (remixHandlers.length) {
            const result = await Promise.all(remixHandlers.map(cb => cb(args)));

            for (const responseResult of result) {
              if (responseResult != null) return responseResult;
            }
          }

          const method = args.request.method;
          const headers = Object.fromEntries(args.request.headers);
          const query = method === 'GET' ? Object.fromEntries(new URL(args.request.url).searchParams) : {};
          const body = method === 'POST' ? await args.request.json().catch(() => null) : null;

          const request = {
            body,
            headers,
            method,
            query,
          };

          const responseHeaders: ResponseHeaders = {};

          const trapReq = new Proxy<IncomingMessage>(
            {
              headers,
              method,
            } as IncomingMessage,
            {
              get(target, key) {
                switch (key) {
                  case 'headers':
                  case 'method': {
                    return target[key];
                  }
                }
                throw Error('Property not available for Remix');
              },
            }
          );

          return requestHandler({
            request,
            req: trapReq,
            getEnveloped,
            baseOptions: appConfig,
            contextArgs() {
              return {
                req: trapReq,
                remix: { ...args, responseHeaders },
              };
            },
            buildContext,
            onResponse(result) {
              for (const { name, value } of result.headers) {
                responseHeaders[name] = value;
              }

              return new Response(JSON.stringify(result.payload), {
                headers: responseHeaders as any,
                status: result.status,
              });
            },
            onMultiPartResponse() {
              throw Error('Not supported for Remix!');
            },
            onPushResponse() {
              throw Error('Not supported for Remix!');
            },
            preProcessRequest,
            processRequestOptions: processRequestOptions && (() => processRequestOptions(args)),
          });
        };

        return (appHandler = EZHandler);
      }),
    ]).then(v => v[0]);

    const handler: RemixAPIHandler = async args => {
      if (appHandler) {
        return appHandler(args);
      }
      const result = await appPromise;
      if (result.status === 'rejected')
        throw Error(
          process.env.NODE_ENV === 'development'
            ? 'Error while building EZ App: ' + (result.reason?.message || JSON.stringify(result.reason))
            : 'Unexpected Error'
        );

      return (await result.value.app)(args);
    };

    return {
      action: handler,
      loader: handler,
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
