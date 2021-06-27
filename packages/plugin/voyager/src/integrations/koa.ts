import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleKoa(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['koa']>) {
  if (!ctx.voyager) return;

  const handler = ctx.voyager.handler(ctx.voyager.options, {
    rawHttp: false,
  });

  instance.router.get(ctx.voyager.path, async ctx => {
    const result = await handler(ctx.req, ctx.res);

    ctx.type = 'text/html';
    ctx.body = result.content;
  });
}
