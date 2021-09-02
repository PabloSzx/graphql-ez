import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export async function handleTinyhttp(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['tinyhttp']>
) {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;
  if (ctx.options.path === path) {
    instance.app.get(path, (req, res, next) => {
      if (shouldRenderGraphiQL(req)) {
        res.type('html').send(html);
      } else {
        next();
      }
    });
  } else {
    instance.app.get(path, (_req, res) => {
      res.type('html').send(html);
    });
  }
}
