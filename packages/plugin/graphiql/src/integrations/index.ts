import type { EZPlugin } from 'graphql-ez';

export const onIntegrationRegister: NonNullable<EZPlugin['onIntegrationRegister']> = async (ctx, integrationCtx) => {
  if (!ctx.graphiql) return;

  if (integrationCtx.fastify) {
    const { handleFastify } = await import('./fastify');

    return handleFastify(ctx, integrationCtx.fastify);
  }

  if (integrationCtx.express) {
    const { handleExpress } = await import('./express');

    return handleExpress(ctx, integrationCtx.express);
  }

  if (integrationCtx.koa) {
    const { handleKoa } = await import('./koa');

    return handleKoa(ctx, integrationCtx.koa);
  }

  if (integrationCtx.hapi) {
    const { handleHapi } = await import('./hapi');

    return handleHapi(ctx, integrationCtx.hapi);
  }

  if (integrationCtx.http) {
    const { handleHttp } = await import('./http');

    return handleHttp(ctx, integrationCtx.http);
  }

  if (integrationCtx.next) {
    const { handleNext } = await import('./next');

    return handleNext(ctx, integrationCtx.next);
  }

  if (integrationCtx.sveltekit) {
    const { handleSvelteKit } = await import('./sveltekit');

    return handleSvelteKit(ctx, integrationCtx.sveltekit);
  }

  if (integrationCtx.cloudflare) {
    const { handleCloudflare } = await import('./cloudflare');

    return handleCloudflare(ctx, integrationCtx.cloudflare);
  }

  if (integrationCtx.vercel) {
    const { handleVercel } = await import('./vercel');

    return handleVercel(ctx, integrationCtx.vercel);
  }

  if (integrationCtx.tinyhttp) {
    const { handleTinyhttp } = await import('./tinyhttp');

    return handleTinyhttp(ctx, integrationCtx.tinyhttp);
  }
};
