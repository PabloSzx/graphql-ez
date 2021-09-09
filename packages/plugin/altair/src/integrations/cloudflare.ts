import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleCloudflare: IntegrationRegisterHandler<'cloudflare'> = async function handleCloudflare({
  ctx,
  integration: { router },
}) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const render = await ctx.altair.render;

  const { endpoint: endpointURL = ctx.options.path || '/graphql', base: baseURLOpt, path: _path, ...renderOptions } = ctx.altair.options;

  const baseURL = withTrailingSlash(baseURLOpt || path);

  router.add('GET', new RegExp(`${withoutTrailingSlash(ctx.altair.baseURL)}/?.*`), async (req, res) => {
    const { status, rawContent, content, contentType } = await render({
      baseURL,
      altairPath: path,
      renderOptions: {
        ...renderOptions,
        endpointURL,
        baseURL,
      },
      url: req.path,
      raw: true,
    });
    res.statusCode = status;
    if (contentType) res.setHeader('content-type', contentType);

    if (rawContent) res.end(rawContent);
    else if (content) res.end(content);
  });
};
