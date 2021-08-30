import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export async function handleCloudflare(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['cloudflare']>
) {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;

  if (ctx.options.path === path) {
    instance.preHandlers.push((req, res) => {
      if (shouldRenderGraphiQL({ headers: req.headers, method: req.method, query: Object.fromEntries(req.query) })) {
        res.setHeader('content-type', 'text/html');
        res.end(html);
      }
    });
  } else {
    instance.router.add('GET', path, (_req, res) => {
      res.setHeader('content-type', 'text/html');
      res.end(html);
    });
  }
}
