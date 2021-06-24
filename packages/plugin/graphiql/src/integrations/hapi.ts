import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core';

export function handleHapi(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>) {
  if (!ctx.graphiql) return;

  const ideHandler = ctx.graphiql.handler(ctx.graphiql.options);

  instance.server.route({
    path: ctx.graphiql.path,
    method: 'GET',
    options: instance.ideRouteOptions,
    async handler(req, h) {
      await ideHandler(req.raw.req, req.raw.res);
      return h.abandon;
    },
  });
}
