import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleKoa(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['koa']>) {
  if (!ctx.graphiql) return;

  const handler = ctx.graphiql.handler(ctx.graphiql.options, {
    rawHttp: false,
  });

  instance.router.get(ctx.graphiql.path, async ctx => {
    const result = await handler(ctx.req, ctx.res);

    if (!result) {
      ctx.status = 404;
      return;
    }

    ctx.type = 'text/html';
    ctx.body = result.content;
  });
}
