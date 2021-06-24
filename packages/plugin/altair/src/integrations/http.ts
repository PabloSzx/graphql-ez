import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core';

export function handleHttp(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['http']>) {
  if (!ctx.altair) return;

  const altair = ctx.altair;

  const path = ctx.altair.path;
  const baseURL = ctx.altair.baseURL;

  const handler = altair.handler({ ...ctx.altair.options, path });

  instance.handlers.push(async (req, res) => {
    const url = req.url || '';
    if (req.method === 'GET' && (url.startsWith(path) || url.startsWith(baseURL))) {
      await handler(req, res);

      return {
        stop: true,
      };
    }

    return;
  });
}
