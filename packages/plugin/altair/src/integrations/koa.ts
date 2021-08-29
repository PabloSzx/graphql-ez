import { withoutTrailingSlash } from '@graphql-ez/utils/url';

import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export async function handleKoa(ctx: InternalAppBuildContext, instance: NonNullable<InternalAppBuildIntegrationContext['koa']>) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;
  const baseURL = ctx.altair.baseURL;

  const render = await ctx.altair.render;

  const { endpointURL = '/graphql', baseURL: baseURLOpt, path: _path, ...renderOptions } = ctx.altair.options;

  instance.router.get([path, baseURL, withoutTrailingSlash(baseURL) + '/(.*)'], async ctx => {
    const { status, content, contentType } = await render({
      baseURL,
      altairPath: path,
      renderOptions: {
        ...renderOptions,
        baseURL,
        endpointURL,
      },
      url: ctx.url,
    });

    ctx.status = status;
    if (contentType) ctx.type = contentType;

    return (ctx.body = content);
  });
}
