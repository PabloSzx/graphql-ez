import { BaseAppBuilder, createEZAppFactory, handleRequest } from 'graphql-ez';
import { getObjectValue } from 'graphql-ez/utils/object';
import { LazyPromise } from 'graphql-ez/utils/promise';

import type { FastifyPluginCallback, FastifyInstance, RouteOptions, FastifyRequest, FastifyReply } from 'fastify';
import type { BuildAppOptions, AppOptions, EZAppFactoryType, Envelop, ProcessRequestOptions } from 'graphql-ez';
import type { FastifyCorsOptions, FastifyCorsOptionsDelegate, FastifyPluginOptionsDelegate } from 'fastify-cors';

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
  fastifyPlugin: FastifyAppPlugin;

  getEnveloped: Promise<Envelop>;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): EZApp;
}

export function CreateApp(config: FastifyAppOptions = {}): EZAppBuilder {
  const path = (config.path ||= '/graphql');

  let ezApp: EZAppFactoryType;

  try {
    ezApp = createEZAppFactory(
      {
        integrationName: 'fastify',
      },
      config
    );
  } catch (err) {
    Error.captureStackTrace(err, CreateApp);
    throw err;
  }

  const { appBuilder, onIntegrationRegister, ...commonApp } = ezApp;

  const buildApp: EZAppBuilder['buildApp'] = function buildApp(buildOptions = {}) {
    const appPromise = LazyPromise(() => {
      return appBuilder(buildOptions, ({ ctx, getEnveloped }) => {
        const { cors, routeOptions, buildContext, onAppRegister, processRequestOptions } = config;
        return async function FastifyPlugin(instance: FastifyInstance) {
          const integration = {
            fastify: instance,
          };

          if (onAppRegister) await onAppRegister({ ctx, integration, getEnveloped });

          await onIntegrationRegister(integration);

          if (cors) {
            const fastifyCors = (await import('fastify-cors')).default;

            await instance.register(fastifyCors, getObjectValue(cors));
          }

          const requestHandler = ctx.options.customHandleRequest || handleRequest;

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
                baseOptions: config,
                buildContextArgs() {
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
              });
            },
          });
        };
      });
    });

    const skipOverride: unique symbol = Symbol.for('skip-override');
    const fastifyPlugin: FastifyPluginCallback & { [skipOverride]?: true } = async function fastifyPlugin(
      instance: FastifyInstance
    ) {
      await (await appPromise).app(instance);
    };
    fastifyPlugin[skipOverride] = true;

    return {
      fastifyPlugin,
      getEnveloped: LazyPromise(() => appPromise.then(v => v.getEnveloped)),
    };
  };

  return {
    ...commonApp,
    buildApp,
  };
}

export * from 'graphql-ez';
