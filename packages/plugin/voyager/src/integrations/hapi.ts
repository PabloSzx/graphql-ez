import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-types';

export function handleHapi(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>) {
  if (!ctx.voyager) return;

  const ideHandler = ctx.voyager.handler(ctx.voyager.options);

  instance.server.route({
    path: ctx.voyager.path,
    method: 'GET',
    options: instance.ideRouteOptions,
    async handler(req, h) {
      await ideHandler(req.raw.req, req.raw.res);
      return h.abandon;
    },
  });
}
