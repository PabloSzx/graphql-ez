import { withTrailingSlash } from '@graphql-ez/utils/url';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleFastify: IntegrationRegisterHandler<'fastify'> = ({ ctx, integration }) => {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const handler = ctx.altair.handler({ ...ctx.altair.options, path });

  integration.get(path, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });

  integration.get(`${withTrailingSlash(ctx.altair.baseURL)}*`, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });
};
