import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export function handleNext(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['next']>) {
  if (!ctx.graphiql) return;

  const graphiqlCtx = ctx.graphiql;

  const handler = graphiqlCtx.handler(graphiqlCtx.options);

  instance.handlers.push(async (req, res) => {
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
}
