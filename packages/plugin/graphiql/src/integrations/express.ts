import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export async function handleExpress(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['express']>
) {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;
  if (ctx.options.path === path) {
    instance.router.get(path, async (req, res, next) => {
      if (shouldRenderGraphiQL(req)) {
        res.type('html').send(html);
      } else {
        next();
      }
    });
  } else {
    instance.router.get(path, (_req, res) => {
      res.type('html').send(html);
    });
  }
}
