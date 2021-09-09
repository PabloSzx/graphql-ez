import { shouldRenderGraphiQL } from '../utils';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleCloudflare: IntegrationRegisterHandler<'cloudflare'> = async ({
  ctx,
  integration: { preHandlers, router },
}) => {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;

  if (ctx.options.path === path) {
    preHandlers.push((req, res) => {
      if (shouldRenderGraphiQL({ headers: req.headers, method: req.method, query: Object.fromEntries(req.query) })) {
        res.setHeader('content-type', 'text/html');
        res.end(html);
      }
    });
  } else {
    router.add('GET', path, (_req, res) => {
      res.setHeader('content-type', 'text/html');
      res.end(html);
    });
  }
};
