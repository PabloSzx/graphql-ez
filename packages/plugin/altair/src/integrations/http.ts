import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleHttp(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['http']>) {
  if (!ctx.altair) return;

  const altair = ctx.altair;

  const handler = altair.handler(ctx.altair.options);

  instance.handlers.push(async (req, res) => {
    if (req.method === 'GET' && req.url?.startsWith(altair.path)) {
      await handler(req, res);

      return {
        stop: true,
      };
    }

    return;
  });
}
