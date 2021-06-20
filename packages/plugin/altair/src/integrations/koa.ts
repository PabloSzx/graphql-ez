import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleKoa(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['koa']>) {
  if (!ctx.altair) return;

  const handler = ctx.altair.handler(ctx.altair.options, {
    rawHttp: false,
  });

  const basePath = ctx.altair.path.endsWith('/') ? ctx.altair.path.slice(0, ctx.altair.path.length - 1) : ctx.altair.path;

  instance.router.get([basePath, basePath + '/(.*)'], async ctx => {
    const result = await handler(ctx.req, ctx.res);

    if (!result) {
      ctx.status = 404;

      return;
    }

    ctx.type = result.contentType;

    return (ctx.body = result.content);
  });
}
