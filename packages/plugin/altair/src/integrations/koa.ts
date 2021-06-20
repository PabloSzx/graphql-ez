import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleKoa(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['koa']>) {
  if (!ctx.altair) return;

  const handler = ctx.altair.handler(ctx.altair.options);

  instance.router.get(ctx.altair.path, async ctx => {
    await handler(ctx.req, ctx.res);
  });

  instance.router.get(`${ctx.altair.baseURL}*`, async ctx => {
    await handler(ctx.req, ctx.res);
  });
}
