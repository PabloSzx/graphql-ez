import { LazyPromise } from '@graphql-ez/utils/promise';
import assert from 'assert';
import { print } from 'graphql';
import type { EZPlugin } from 'graphql-ez';
import type { createHandler, Handler, HandlerOptions } from 'graphql-sse';

export interface GraphQLSSEOptions {
  options?: Omit<HandlerOptions, 'execute' | 'subscribe' | 'validate' | 'onSubscribe' | 'schema' | 'context'>;
  /**
   * @default "/graphql/stream"
   */
  path?: string;
}

declare module 'graphql-ez' {
  interface InternalAppBuildContext {
    sse?: {
      deps: Promise<{
        createHandler?: typeof createHandler;
      }>;
      options: GraphQLSSEOptions;
      path: string;
      handler?: Handler;
    };
  }
}

export const ezSSE = (options: GraphQLSSEOptions = {}): EZPlugin => {
  const deps = LazyPromise(async () => {
    const { createHandler } = await import('graphql-sse');

    return { createHandler };
  });

  const path = options.path || '/graphql/stream';

  return {
    name: 'graphql-sse',
    onRegister(ctx) {
      ctx.sse = {
        options,
        deps,
        path,
      };
    },
    async onAfterBuild(getEnveloped, ctx) {
      assert(ctx.sse, 'Error while building graphql-sse plugin');

      const { createHandler } = await deps;

      const { options } = ctx.sse;

      const { buildContext } = ctx.options;

      const { execute, subscribe, validate } = getEnveloped();

      const handler = createHandler({
        ...options,
        execute,
        subscribe,
        validate,
        async onSubscribe(req, _res, params) {
          const contextArgsData = { req };
          const { schema, parse, contextFactory } = getEnveloped(
            buildContext ? Object.assign(contextArgsData, await buildContext(contextArgsData)) : contextArgsData
          );
          const queryDocument = parse(typeof params.query === 'string' ? params.query : print(params.query));
          return {
            schema,
            operationName: params.operationName,
            document: queryDocument,
            variableValues: params.variables,
            contextValue: await contextFactory(req),
          };
        },
      });

      ctx.sse.handler = handler;
    },
    compatibilityList: ['fastify', 'express', 'http', 'hapi', 'koa'],
    async onIntegrationRegister(ctx, integrationCtx) {
      assert(ctx.sse, 'Error while building graphql-sse plugin');
      assert(ctx.sse.handler, 'Error while building handler for graphql-sse');

      const { path, handler } = ctx.sse;

      if (integrationCtx.fastify) {
        integrationCtx.fastify.all(path, (req, reply) => handler(req.raw, reply.raw, req.body));
        return;
      }

      if (integrationCtx.express) {
        integrationCtx.express.router.all(path, handler);
        return;
      }

      if (integrationCtx.http) {
        integrationCtx.http.handlers.push(async (req, res) => {
          if (!req.url?.startsWith(path)) return;

          await handler(req, res);

          return {
            stop: true,
          };
        });

        return;
      }

      if (integrationCtx.hapi) {
        integrationCtx.hapi.server.route({
          path,
          method: '*',
          async handler(req, h) {
            await handler(req.raw.req, req.raw.res);
            return h.abandon;
          },
        });

        return;
      }

      if (integrationCtx.koa) {
        integrationCtx.koa.router.all('graphql-sse', path, async ctx => {
          ctx.respond = false;

          await handler(ctx.req, ctx.res);
        });

        return;
      }
    },
  };
};
