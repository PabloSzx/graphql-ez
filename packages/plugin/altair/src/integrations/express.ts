import { withTrailingSlash } from '@graphql-ez/utils/url';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleExpress: IntegrationRegisterHandler<'express'> = ({ ctx, integration: { router } }) => {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const handler = ctx.altair.handler({ ...ctx.altair.options, path });

  router.get([path, `${withTrailingSlash(ctx.altair.baseURL)}*`], async (req, res) => {
    await handler(req, res);
  });
};
