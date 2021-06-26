import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-types';

export function handleExpress(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['express']>
) {
  if (!ctx.voyager) return;

  const handler = ctx.voyager.handler(ctx.voyager.options);

  instance.router.get(ctx.voyager.path, async (req, res) => {
    await handler(req, res);
  });
}
