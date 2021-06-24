import type { EZPlugin } from '@graphql-ez/core-app';

export const onIntegrationRegister: NonNullable<EZPlugin['onIntegrationRegister']> = async (ctx, integrationCtx) => {
  if (!ctx.altair) return;

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
    return console.warn(
      `[graphql-ez] You don't need to add Altair plugin in your EZ App for Next.js, use "UnpkgAltairHandler" directly in your API Routes.`
    );
  }
};
