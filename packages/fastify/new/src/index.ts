import { BaseAppBuilder, createEnvelopAppFactory, handleRequest } from '@graphql-ez/core-app';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import type { FastifyPluginCallback, FastifyInstance, RouteOptions, FastifyRequest, FastifyReply } from 'fastify';
import type { BuildAppOptions, BaseEZApp, AppOptions, InternalAppBuildContext } from '@graphql-ez/core-types';
import type { FastifyCorsOptions, FastifyCorsOptionsDelegate, FastifyPluginOptionsDelegate } from 'fastify-cors';

declare module '@graphql-ez/core-types' {
  interface BuildContextArgs {
    fastify?: {
      request: FastifyRequest;
      reply: FastifyReply;
    };
  }
}

interface FastifyAppOptions extends AppOptions {
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
   * Custom on app register callback with access to internal build context
   */
  onAppRegister?(ctx: InternalAppBuildContext, instance: FastifyInstance): void | Promise<void>;
}

export type FastifyAppPlugin = FastifyPluginCallback<{}>;

export interface EZApp extends BaseEZApp {
  fastifyPlugin: FastifyAppPlugin;
}

export interface EZAppBuilder extends BaseAppBuilder {
  buildApp(options?: BuildAppOptions): EZApp;
}

export function CreateApp(config: FastifyAppOptions = {}): EZAppBuilder {
  const { appBuilder, ...commonApp } = createEnvelopAppFactory(
    {
      moduleName: 'fastify',
    },
    config,
    {}
  );

  const buildApp = function buildApp(buildOptions: BuildAppOptions): EZApp {
    const appPromise = appBuilder(buildOptions, ({ ctx, envelop }) => {
      const { cors, routeOptions, path = '/graphql', buildContext, onAppRegister } = config;
      return async function FastifyPlugin(instance: FastifyInstance) {
        if (onAppRegister) await onAppRegister?.(ctx, instance);

        if (cors) {
          const fastifyCors = (await import('fastify-cors')).default;

          await instance.register(fastifyCors, typeof cors !== 'boolean' ? cors : undefined);
        }

        if (ctx.options.ide) {
          const altairHandler = ctx.altairHandler || ctx.unpkgAltairHandler;
          if (ctx.options.ide.altair && altairHandler) {
            const handler = altairHandler(ctx.options.ide.altair);

            instance.get('/altair', async (req, res) => {
              res.hijack();

              await handler(req.raw, res.raw);
            });

            instance.get('/altair/*', async (req, res) => {
              res.hijack();
              await handler(req.raw, res.raw);
            });
          }

          if (ctx.options.ide.graphiql && ctx.graphiQLHandler) {
            const handler = ctx.graphiQLHandler(ctx.options.ide.graphiql);

            instance.get('/graphiql', async (req, res) => {
              res.hijack();
              await handler(req.raw, res.raw);
            });
          }
        }

        const requestHandler = ctx.options.customHandleRequest || handleRequest;

        instance.route({
          ...routeOptions,
          method: ['GET', 'POST'],
          url: path,
          handler(req, reply) {
            const request = {
              body: req.body,
              headers: req.headers,
              method: req.method,
              query: req.query,
            };

            return requestHandler({
              request,
              getEnveloped: envelop,
              baseOptions: config,
              buildContextArgs() {
                return {
                  req: req.raw,
                  fastify: {
                    request: req,
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
                return defaultHandle(req.raw, reply.raw, result);
              },
              onPushResponse(result, defaultHandle) {
                reply.hijack();
                return defaultHandle(req.raw, reply.raw, result);
              },
            });
          },
        });
      };
    });

    return {
      async fastifyPlugin(instance) {
        await (await appPromise).app(instance);
      },
      getEnveloped: LazyPromise(() => appPromise.then(v => v.getEnveloped)),
    };
  };

  return {
    ...commonApp,
    buildApp,
  };
}
