import { withTrailingSlash } from '@graphql-ez/utils/url';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleHapi: IntegrationRegisterHandler<'hapi'> = ({ ctx, integration: { server, ideRouteOptions } }) => {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const handler = ctx.altair.handler({ ...ctx.altair.options, path });

  server.route({
    path: `${withTrailingSlash(ctx.altair.baseURL)}{any*}`,
    method: 'GET',
    options: ideRouteOptions,
    async handler(req, h) {
      await handler(req.raw.req, req.raw.res);

      return h.abandon;
    },
  });
};
