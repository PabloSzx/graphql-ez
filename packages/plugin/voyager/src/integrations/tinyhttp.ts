import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleTinyhttp(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['tinyhttp']>
) {
  if (!ctx.voyager) return;

  const handler = ctx.voyager.handler(ctx.voyager.options);

  instance.app.get(ctx.voyager.path, async (req, res) => {
    await handler(req, res);
  });
}
