import type { EZPlugin } from 'graphql-ez';

export const onIntegrationRegister: NonNullable<EZPlugin['onIntegrationRegister']> = async ctx => {
  if (!ctx.graphiql) return;

  return {
    async fastify(args) {
      const { handleFastify } = await import('./fastify');

      return handleFastify(args);
    },
    async express(args) {
      const { handleExpress } = await import('./express');

      return handleExpress(args);
    },
    async koa(args) {
      const { handleKoa } = await import('./koa');

      return handleKoa(args);
    },
    async hapi(args) {
      const { handleHapi } = await import('./hapi');

      return handleHapi(args);
    },
    async http(args) {
      const { handleHttp } = await import('./http');

      return handleHttp(args);
    },
    async nextjs(args) {
      const { handleNext } = await import('./next');

      return handleNext(args);
    },
    async sveltekit(args) {
      const { handleSvelteKit } = await import('./sveltekit');

      return handleSvelteKit(args);
    },
    async cloudflare(args) {
      const { handleCloudflare } = await import('./cloudflare');

      return handleCloudflare(args);
    },
    async vercel(args) {
      const { handleVercel } = await import('./vercel');

      return handleVercel(args);
    },
  };
};
