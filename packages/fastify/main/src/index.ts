import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import type { FastifyCorsOptions, FastifyCorsOptionsDelegate, FastifyPluginOptionsDelegate } from '@fastify/cors';
import type { AppOptions, BuildAppOptions, EZAppFactoryType, GetEnvelopedFn, ProcessRequestOptions } from 'graphql-ez';
import {
  BaseAppBuilder,
  createEZAppFactory,
  handleRequest,
  InternalAppBuildContextKey,
  InternalAppBuildContext,
} from 'graphql-ez';

declare module 'graphql-ez' {
  interface BuildContextArgs {
    fastify?: {
      request: FastifyRequest;
      reply: FastifyReply;
    };
  }

  interface InternalAppBuildIntegrationContext {
    fastify?: FastifyInstance;
  }
}

export interface FastifyAppOptions extends AppOptions {
  path?: string;
  /**
   * Enable or configure CORS
   */
  cors?: boolean | FastifyCorsOptions | FastifyPluginOptionsDelegate<FastifyCorsOptionsDelegate>;

  /**
   * Custom Fastify Route options
   */
  routeOptions?: Omit<RouteOptions, 'method' | 'url' | 'handler'>;

  /**
   * Customize some Helix processRequest options
   */
  processRequestOptions?: (req: FastifyRequest, reply: FastifyReply) => ProcessRequestOptions;
}

export type FastifyAppPlugin = FastifyPluginCallback<{}>;

declare module 'fastify' {
  interface FastifyRequest {
    isMultipart?: true;
  }
}

export interface EZApp {
  readonly fastifyPlugin: FastifyAppPlugin;

  readonly getEnveloped: Promise<GetEnvelopedFn<unknown>>;

  readonly path: string;

  readonly ready: Promise<void>;

  [InternalAppBuildContextKey]: InternalAppBuildContext;
}

export interface EZAppBuilder extends BaseAppBuilder {
  readonly buildApp: (options?: BuildAppOptions) => EZApp;

  readonly path: string;
}

export function CreateApp(config: FastifyAppOptions = {}): EZAppBuilder {
  const appConfig = { ...config };

  const path = (appConfig.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'fastify',
      },
      appConfig
    );
  } catch (err) {
    err instanceof Error && Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions = {}) {
    const appPromise = LazyPromise(() => {
      return appBuilder(buildOptions, ({ ctx, getEnveloped }) => {
        const { cors, routeOptions, buildContext, onAppRegister, processRequestOptions } = appConfig;
        return async function FastifyPlugin(instance: FastifyInstance) {
          const integration = {
            fastify: instance,
          };

          if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

          await onIntegrationRegister(integration);

          if (cors) {
            const fastifyCors = (await import('@fastify/cors')).default;

            await instance.register(fastifyCors, getObjectValue(cors));
          }

          const {
            preProcessRequest,
            options: { customHandleRequest },
          } = ctx;

          const requestHandler = customHandleRequest || handleRequest;

          instance.route({
            ...routeOptions,
            method: ['GET', 'POST'],
            url: path,
            handler(fastifyReq, reply) {
              const request = {
                body: fastifyReq.body,
                headers: fastifyReq.headers,
                method: fastifyReq.method,
                query: fastifyReq.query,
              };

              const req = fastifyReq.raw;

              return requestHandler({
                req,
                request,
                getEnveloped,
                baseOptions: appConfig,
                contextArgs() {
                  return {
                    req,
                    fastify: {
                      request: fastifyReq,
                      reply,
                    },
                  };
                },
                buildContext,
                onResponse(result) {
                  for (const { name, value } of result.headers) {
                    reply.header(name, value);
                  }
                  reply.status(result.status);
                  reply.send(result.payload);
                },
                onMultiPartResponse(result, defaultHandle) {
                  reply.hijack();
                  return defaultHandle(req, reply.raw, result);
                },
                onPushResponse(result, defaultHandle) {
                  reply.hijack();
                  return defaultHandle(req, reply.raw, result);
                },
                processRequestOptions: processRequestOptions && (() => processRequestOptions(fastifyReq, reply)),
                preProcessRequest,
              });
            },
          });
        };
      });
    });

    const skipOverride: unique symbol = Symbol.for('skip-override');
    const fastifyPlugin: FastifyPluginCallback & { [skipOverride]?: boolean } = async function fastifyPlugin(
      instance: FastifyInstance
    ) {
      await (await appPromise).app(instance);
    };
    fastifyPlugin[skipOverride] = true;

    return {
      fastifyPlugin,
      getEnveloped: LazyPromise(() => appPromise.then(v => v.getEnveloped)),
      path,
      ready: LazyPromise(async () => {
        await appPromise;
      }),
      [InternalAppBuildContextKey]: ezApp[InternalAppBuildContextKey],
    };
  };

  return {
    ...commonApp,
    path,
    buildApp,
  };
}

export * from 'graphql-ez';
