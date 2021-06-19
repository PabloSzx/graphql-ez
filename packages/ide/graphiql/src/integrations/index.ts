import type { EZPlugin } from '@graphql-ez/core-app';

export const onIntegrationRegister: NonNullable<EZPlugin['onIntegrationRegister']> = async (ctx, integrationCtx) => {
  if (!ctx.altair) return;

  if (integrationCtx.fastify) {
    const { handleFastify } = await import('./fastify');

    handleFastify(ctx, integrationCtx.fastify);
  }
};
