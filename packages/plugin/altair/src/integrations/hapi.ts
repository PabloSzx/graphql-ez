import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleHapi(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>) {
  if (!ctx.altair) return;

  const handler = ctx.altair.handler(ctx.altair.options);

  const basePath = ctx.altair.path.endsWith('/') ? ctx.altair.path.slice(0, ctx.altair.path.length - 1) : ctx.altair.path;

  const wildCardPath = `${basePath}/{any*}`;

  instance.server.route({
    path: wildCardPath,
    method: 'GET',
    options: instance.ideRouteOptions,
    async handler(req, h) {
      await handler(req.raw.req, req.raw.res);

      return h.abandon;
    },
  });
}
