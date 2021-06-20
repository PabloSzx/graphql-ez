import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleFastify(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['fastify']>
) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const handler = ctx.altair.handler({ ...ctx.altair.options, path });

  instance.get(path, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });

  instance.get(`${ctx.altair.baseURL}*`, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });
}
