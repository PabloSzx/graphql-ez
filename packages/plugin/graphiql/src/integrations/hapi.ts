import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export function handleHapi(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>) {
  if (!ctx.graphiql) return;

  const path = ctx.graphiql.path;

  const ideHandler = ctx.graphiql.handler(ctx.graphiql.options);

  if (ctx.graphiql.path === ctx.options.path) {
    instance.preHandler.push(async (req, h) => {
      if (!shouldRenderGraphiQL(req)) return;

      await ideHandler(req.raw.req, req.raw.res);
      return h.abandon;
    });
  } else {
    instance.server.route({
      path,
      method: 'GET',
      options: instance.ideRouteOptions,
      async handler(req, h) {
        await ideHandler(req.raw.req, req.raw.res);
        return h.abandon;
      },
    });
  }
}
