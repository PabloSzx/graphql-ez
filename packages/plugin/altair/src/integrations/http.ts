import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleHttp: IntegrationRegisterHandler<'http'> = ({ ctx, integration: { handlers } }) => {
  if (!ctx.altair) return;

  const altair = ctx.altair;

  const path = ctx.altair.path;
  const baseURL = ctx.altair.baseURL;

  const handler = altair.handler({ ...ctx.altair.options, path });

  handlers.push(async (req, res) => {
    const url = req.url || '';
    if (req.method === 'GET' && (url.startsWith(path) || url.startsWith(baseURL))) {
      await handler(req, res);

      return {
        stop: true,
      };
    }

    return;
  });
};
