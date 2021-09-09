import { withoutTrailingSlash } from '@graphql-ez/utils/url';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleKoa: IntegrationRegisterHandler<'koa'> = async ({ ctx, integration: { router } }) => {
  if (!ctx.altair) return;

  const path = ctx.altair.path;
  const baseURL = ctx.altair.baseURL;

  const render = await ctx.altair.render;

  const { endpoint = ctx.options.path || '/graphql', baseURL: baseURLOpt, path: _path, ...renderOptions } = ctx.altair.options;

  router.get([path, baseURL, withoutTrailingSlash(baseURL) + '/(.*)'], async ctx => {
    const { status, content, contentType } = await render({
      baseURL,
      altairPath: path,
      renderOptions: {
        ...renderOptions,
        baseURL,
        endpointURL: endpoint,
      },
      url: ctx.url,
    });

    ctx.status = status;
    if (contentType) ctx.type = contentType;

    return (ctx.body = content);
  });
};
