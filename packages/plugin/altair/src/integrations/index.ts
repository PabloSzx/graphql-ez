import type { EZPlugin } from 'graphql-ez';

export const onIntegrationRegister: NonNullable<EZPlugin['onIntegrationRegister']> = async ctx => {
  if (!ctx.altair) return;

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
    nextjs() {
      return console.warn(
        `[graphql-ez] You don't need to add the Altair plugin in your EZ App for Next.js, use "UnpkgAltairHandler" directly in your API Routes.`
      );
    },
    vercel() {
      return console.warn(
        `[graphql-ez] You don't need to add the Altair plugin in your EZ App for Vercel, use "UnpkgAltairHandler" directly in your API Routes and vercel.json config. Check README.`
      );
    },
    async sveltekit(args) {
      const { handleSvelteKit } = await import('./sveltekit');

      return handleSvelteKit(args);
    },
    async cloudflare(args) {
      const { handleCloudflare } = await import('./cloudflare');

      return handleCloudflare(args);
    },
  };
};
