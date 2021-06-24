import { withTrailingSlash } from '@graphql-ez/core-utils/url';

import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core';

export function handleHapi(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const handler = ctx.altair.handler({ ...ctx.altair.options, path });

  instance.server.route({
    path: `${withTrailingSlash(ctx.altair.baseURL)}{any*}`,
    method: 'GET',
    options: instance.ideRouteOptions,
    async handler(req, h) {
      await handler(req.raw.req, req.raw.res);

      return h.abandon;
    },
  });
}
