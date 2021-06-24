import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core';

export function handleFastify(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['fastify']>
) {
  if (!ctx.graphiql) return;

  const handler = ctx.graphiql.handler(ctx.graphiql.options);

  instance.get(ctx.graphiql.path, async (req, res) => {
    res.hijack();
    await handler(req.raw, res.raw);
  });
}
