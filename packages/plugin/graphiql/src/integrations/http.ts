import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleHttp(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['http']>) {
  if (!ctx.graphiql) return;

  const handler = ctx.graphiql.handler(ctx.graphiql.options);

  const path = ctx.graphiql.path;

  instance.handlers.push(async (req, res) => {
    if (req.method !== 'GET' || !req.url?.startsWith(path)) return;

    await handler(req, res);

    return {
      stop: true,
    };
  });
}
