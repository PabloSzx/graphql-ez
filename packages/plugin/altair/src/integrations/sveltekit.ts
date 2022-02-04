import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleSvelteKit: IntegrationRegisterHandler<'sveltekit'> = async ({ ctx, integration: { handlers } }) => {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const render = await ctx.altair.render;

  const {
    endpoint = ctx.options.path || '/api/graphql',
    baseURL: baseURLOpt,
    path: _path,
    ...renderOptions
  } = ctx.altair.options;

  const baseURL = withTrailingSlash(baseURLOpt || path);

  const baseURLTrailing = withTrailingSlash(ctx.altair.baseURL);
  const baseURLNoTrailing = withoutTrailingSlash(ctx.altair.baseURL);

  handlers.push(req => {
    const pathname = req.url.pathname;

    if (pathname === baseURLTrailing || pathname === baseURLNoTrailing || pathname.startsWith(baseURLTrailing)) {
      return render({
        baseURL,
        altairPath: path,
        renderOptions: {
          ...renderOptions,
          endpointURL: endpoint,
          baseURL,
        },
        url: req.url.pathname,
      }).then(({ status, content, contentType }) => {
        return {
          headers: contentType ? { 'content-type': contentType } : ({} as {}),
          status,
          body: content,
        };
      });
    }

    return;
  });
};
