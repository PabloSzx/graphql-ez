import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleFastify(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['fastify']>
) {
  if (!ctx.altair) return;

  const handler = ctx.altair.handler(ctx.altair.options);

  instance.get(ctx.altair.path, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });

  instance.get(ctx.altair.baseURL, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });
}
