import type { IntegrationRegisterHandler } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export const handleVercel: IntegrationRegisterHandler<'vercel'> = async ({ ctx, integration: { handlers } }) => {
  if (!ctx.graphiql) return;

  const graphiqlCtx = ctx.graphiql;

  const handler = graphiqlCtx.handler(graphiqlCtx.options);

  handlers.push(async (req, res) => {
    const method = req.method;
    if (
      method !== 'GET' ||
      !shouldRenderGraphiQL({
        headers: req.headers,
        method,
        query: req.query,
      })
    ) {
      return;
    }

    await handler(req, res);

    return {
      stop: true,
    };
  });
};
