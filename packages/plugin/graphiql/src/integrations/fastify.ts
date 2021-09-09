import type { IntegrationRegisterHandler } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export const handleFastify: IntegrationRegisterHandler<'fastify'> = async ({ ctx, integration }) => {
  if (!ctx.graphiql) return;

  const html = await ctx.graphiql.html;

  if (ctx.graphiql.path === ctx.options.path) {
    const path = ctx.options.path;

    integration.addHook('onRequest', async (req, reply) => {
      if (
        req.routerPath !== path ||
        !shouldRenderGraphiQL({
          headers: req.headers,
          method: req.method,
          query: Object.fromEntries(new URL(`http://${req.url}`).searchParams),
        })
      ) {
        return;
      }

      reply.type('text/html').send(html);
    });
  } else {
    integration.get(ctx.graphiql.path, async (_req, reply) => {
      reply.type('text/html').send(html);
    });
  }
};
