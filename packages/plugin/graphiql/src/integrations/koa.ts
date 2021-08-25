import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export async function handleKoa(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['koa']>) {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;

  if (path === ctx.options.path) {
    instance.router.use(path, async (ctx, next) => {
      if (!shouldRenderGraphiQL(ctx.request)) return next();

      ctx.type = 'text/html';
      ctx.body = html;
    });
  } else {
    instance.router.get(path, async ctx => {
      ctx.type = 'text/html';
      ctx.body = html;
    });
  }
}
