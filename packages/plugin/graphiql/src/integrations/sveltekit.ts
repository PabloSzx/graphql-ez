import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL, getPathname } from '../utils';

export async function handleSvelteKit(
  ctx: InternalAppBuildContext,
  { handlers }: NonNullable<InternalAppBuildIntegrationContext['sveltekit']>
) {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  const path = ctx.graphiql.path;

  const objResponse = {
    status: 200,
    headers: {
      'content-type': 'text/html',
    },
    body: html,
  };

  // If no root path is specific, the expected behavior is
  // to render graphiql only if the method is GET and no query params are specified
  if (!ctx.options.path) {
    handlers.push(async req => {
      if (
        !shouldRenderGraphiQL({
          headers: req.headers,
          method: req.method,
          query: Object.fromEntries(req.query),
        })
      ) {
        return;
      }

      return objResponse;
    });
  }
  // If root path is specified and the path is the same as the root, the expected behavior is to render graphiql
  // only if the path and request path match, method is GET and no query params are specified
  else if (ctx.options.path === path) {
    handlers.push(async req => {
      if (getPathname(req.path) !== path) return;

      if (
        !shouldRenderGraphiQL({
          headers: req.headers,
          method: req.method,
          query: Object.fromEntries(req.query),
        })
      ) {
        return;
      }

      return objResponse;
    });
  }
  // If root path is different than the graphiql one, the expected behavior is
  // to render graphiql if the path matches and method is GET
  else {
    handlers.push(async req => {
      if (getPathname(req.path) !== path || req.method !== 'GET') return;

      return objResponse;
    });
  }
}
