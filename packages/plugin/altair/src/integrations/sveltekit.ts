import { getPathname, withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export async function handleSvelteKit(
  ctx: InternalAppBuildContext,
  { handlers }: NonNullable<InternalAppBuildIntegrationContext['sveltekit']>
) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const render = await ctx.altair.render;

  const {
    endpointURL = ctx.options.path || '/api/graphql',
    baseURL: baseURLOpt,
    path: _path,
    ...renderOptions
  } = ctx.altair.options;

  const baseURL = withTrailingSlash(baseURLOpt || path);

  const baseURLTrailing = withTrailingSlash(ctx.altair.baseURL);
  const baseURLNoTrailing = withoutTrailingSlash(ctx.altair.baseURL);

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
}
