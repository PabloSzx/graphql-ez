import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleFastify(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['fastify']>
) {
  if (!ctx.voyager) return;

  const handler = ctx.voyager.handler(ctx.voyager.options);

  instance.get(ctx.voyager.path, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });
}
