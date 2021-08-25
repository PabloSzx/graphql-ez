import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { shouldRenderGraphiQL } from '../utils';

export function handleHttp(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['http']>) {
  if (!ctx.graphiql) return;

  const handler = ctx.graphiql.handler(ctx.graphiql.options);

  const path = ctx.graphiql.path;

  if (path === ctx.options.path) {
    instance.handlers.push(async (req, res) => {
      const method = req.method;
      if (
        method !== 'GET' ||
        !req.url?.startsWith(path) ||
        !shouldRenderGraphiQL({
          headers: req.headers,
          method,
          query: req.url ? Object.fromEntries(new URL(`http://${req.url}`).searchParams) : {},
        })
      ) {
        return;
      }

      await handler(req, res);

      return {
        stop: true,
      };
    });
  } else {
    instance.handlers.push(async (req, res) => {
      if (req.method !== 'GET' || !req.url?.startsWith(path)) return;

      await handler(req, res);

      return {
        stop: true,
      };
    });
  }
}
