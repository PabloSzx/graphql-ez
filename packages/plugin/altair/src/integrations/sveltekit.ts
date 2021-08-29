import { getPathname, withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import fetch from 'node-fetch';
import { altairUnpkgDist, renderAltair } from '../unpkg';

export function handleSvelteKit(
  ctx: InternalAppBuildContext,
  { handlers }: NonNullable<InternalAppBuildIntegrationContext['sveltekit']>
) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const { endpointURL = '/api/graphql', baseURL: baseURLOpt, path: _path, ...renderOptions } = ctx.altair.options;

  const baseURL = withTrailingSlash(baseURLOpt || path);

  const baseURLTrailing = withTrailingSlash(ctx.altair.baseURL);
  const baseURLNoTrailing = withoutTrailingSlash(ctx.altair.baseURL);

  handlers.push(async req => {
    const pathname = getPathname(req.path)!;

    if (pathname === baseURLTrailing || pathname === baseURLNoTrailing) {
      const content = await renderAltair({
        ...renderOptions,
        baseURL,
        endpointURL,
      });

      return {
        headers: {
          'content-type': 'text/html',
        } as Record<string, string>,
        body: content,
        status: 200,
      };
    } else if (pathname.startsWith(baseURLTrailing)) {
      const resolvedPath = altairUnpkgDist + req.path.slice(baseURL.length);

      const fetchResult = await fetch(resolvedPath).catch(() => null);

      if (!fetchResult) {
        return {
          status: 404,
          headers: {} as {},
        };
      }

      const result = await fetchResult.arrayBuffer().catch(() => null);

      const contentType = fetchResult.headers.get('content-type');

      if (!result || !contentType) {
        return {
          status: 404,
          headers: {},
        };
      }

      const content = Buffer.from(result);

      return {
        status: 200,
        headers: {
          'content-type': contentType,
        },
        body: content,
      };
    }

    return;
  });
}
