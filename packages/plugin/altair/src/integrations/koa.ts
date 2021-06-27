import { withoutTrailingSlash } from 'graphql-ez/utils/url';

import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleKoa(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['koa']>) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;
  const baseURL = ctx.altair.baseURL;

  const handler = ctx.altair.handler(
    { ...ctx.altair.options, path },
    {
      rawHttp: false,
    }
  );

  instance.router.get([path, baseURL, withoutTrailingSlash(baseURL) + '/(.*)'], async ctx => {
    const result = await handler(ctx.req, ctx.res);

    if (!result) {
      ctx.status = 404;

      return;
    }

    ctx.type = result.contentType;

    return (ctx.body = result.content);
  });
}
