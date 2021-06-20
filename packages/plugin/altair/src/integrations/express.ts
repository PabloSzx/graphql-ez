import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleExpress(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['express']>
) {
  if (!ctx.altair) return;

  const handler = ctx.altair.handler(ctx.altair.options);

  instance.router.get(ctx.altair.path, async (req, res) => {
    await handler(req, res);
  });

  instance.router.get(`${ctx.altair.baseURL}*`, async (req, res) => {
    await handler(req, res);
  });
}
