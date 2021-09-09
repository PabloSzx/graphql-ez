import type { IntegrationRegisterHandler } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export const handleHapi: IntegrationRegisterHandler<'hapi'> = async ({
  ctx,
  integration: { preHandler, server, ideRouteOptions },
}) => {
  if (!ctx.graphiql) return;

  const path = ctx.graphiql.path;

  const ideHandler = ctx.graphiql.handler(ctx.graphiql.options);

  if (ctx.graphiql.path === ctx.options.path) {
    preHandler.push(async (req, h) => {
      if (!shouldRenderGraphiQL(req)) return;

      await ideHandler(req.raw.req, req.raw.res);
      return h.abandon;
    });
  } else {
    server.route({
      path,
      method: 'GET',
      options: ideRouteOptions,
      async handler(req, h) {
        await ideHandler(req.raw.req, req.raw.res);
        return h.abandon;
      },
    });
  }
};
