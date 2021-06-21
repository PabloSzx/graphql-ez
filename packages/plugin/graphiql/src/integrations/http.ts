import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleHttp(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['http']>) {
  if (!ctx.graphiql) return;

  const handler = ctx.graphiql.handler(ctx.graphiql.options);

  const path = ctx.graphiql.path;

  instance.handlers.push(async (req, res) => {
    if (req.method === 'GET' && req.url?.startsWith(path)) {
      await handler(req, res);

      return {
        stop: true,
      };
    }

    return;
  });
}
