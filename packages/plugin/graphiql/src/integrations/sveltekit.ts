import type { IntegrationRegisterHandler } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export const handleSvelteKit: IntegrationRegisterHandler<'sveltekit'> = async ({ ctx, integration: { handlers } }) => {
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
          headers: req.request.headers,
          method: req.request.method,
          query: Object.fromEntries(req.url.searchParams),
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
      if (req.url.pathname !== path) return;

      if (
        !shouldRenderGraphiQL({
          headers: req.request.headers,
          method: req.request.method,
          query: Object.fromEntries(req.url.searchParams),
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
      if (req.url.pathname !== path || req.request.method !== 'GET') return;

      return objResponse;
    });
  }
};
