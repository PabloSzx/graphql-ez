import type { IntegrationRegisterHandler } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export const handleKoa: IntegrationRegisterHandler<'koa'> = async ({ ctx, integration: { router } }) => {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;

  if (path === ctx.options.path) {
    router.use(path, async (ctx, next) => {
      if (!shouldRenderGraphiQL(ctx.request)) return next();

      ctx.type = 'text/html';
      ctx.body = html;
    });
  } else {
    router.get(path, async ctx => {
      ctx.type = 'text/html';
      ctx.body = html;
    });
  }
};
