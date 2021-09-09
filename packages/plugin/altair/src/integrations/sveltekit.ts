import { getPathname, withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { IntegrationRegisterHandler } from 'graphql-ez';

export const handleSvelteKit: IntegrationRegisterHandler<'sveltekit'> = async ({ ctx, integration: { handlers } }) => {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const render = await ctx.altair.render;

  const { endpoint = ctx.options.path || '/api/graphql', base: baseURLOpt, path: _path, ...renderOptions } = ctx.altair.options;

  const baseURL = withTrailingSlash(baseURLOpt || path);

  const baseURLTrailing = withTrailingSlash(ctx.altair.baseURL);
  const baseURLNoTrailing = withoutTrailingSlash(ctx.altair.baseURL);
  const endpointURL = endpoint;

  handlers.push(async req => {
    const pathname = getPathname(req.path)!;

    if (pathname === baseURLTrailing || pathname === baseURLNoTrailing || pathname.startsWith(baseURLTrailing)) {
      const { status, content, contentType } = await render({
        baseURL,
        altairPath: path,
        renderOptions: {
          ...renderOptions,
          endpointURL,
          baseURL,
        },
        url: req.path,
      });

      return {
        headers: contentType ? { 'content-type': contentType } : ({} as {}),
        status,
        body: content,
      };
    }

    return;
  });
};
