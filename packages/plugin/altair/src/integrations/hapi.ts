import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleHapi(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const handler = ctx.altair.handler({ ...ctx.altair.options, path });

  const wildCardPath = `${ctx.altair.baseURL}/{any*}`;

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
