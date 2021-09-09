import type { IntegrationRegisterHandler } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export const handleExpress: IntegrationRegisterHandler<'express'> = async ({ ctx, integration: { router } }) => {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;
  if (ctx.options.path === path) {
    router.get(path, async (req, res, next) => {
      if (shouldRenderGraphiQL(req)) {
        res.type('html').send(html);
      } else {
        next();
      }
    });
  } else {
    router.get(path, (_req, res) => {
      res.type('html').send(html);
    });
  }
};
