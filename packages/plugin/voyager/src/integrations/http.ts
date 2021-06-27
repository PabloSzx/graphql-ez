import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleHttp(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['http']>) {
  if (!ctx.voyager) return;

  const handler = ctx.voyager.handler(ctx.voyager.options);

  const path = ctx.voyager.path;

  instance.handlers.push(async (req, res) => {
    if (req.method !== 'GET' || !req.url?.startsWith(path)) return;

    await handler(req, res);

    return {
      stop: true,
    };
  });
}
