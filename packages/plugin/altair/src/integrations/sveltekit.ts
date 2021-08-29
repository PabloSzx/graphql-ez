import { renderAltair } from '../unpkg';

import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';
import { getPathname, withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';

export function handleHttp(
  ctx: InternalAppBuildContext,
  { handlers }: NonNullable<InternalAppBuildIntegrationContext['sveltekit']>
) {
  if (!ctx.altair) return;

  const altair = ctx.altair;

  const path = ctx.altair.path;

  const { endpointURL = '/api/graphql', baseURL: baseURLOpt, path: _path, ...renderOptions } = ctx.altair.options;

  const baseURL = withTrailingSlash(baseURLOpt || path);

  const baseURLTrailing = withTrailingSlash(ctx.altair.baseURL);
  const baseURLNoTrailing = withoutTrailingSlash(ctx.altair.baseURL);

  const handler = altair.handler({ ...ctx.altair.options, path });

  handlers.push(async req => {
    const pathname = getPathname(req.path)!;

    if (pathname === baseURLTrailing || pathname === baseURLNoTrailing) {
    } else if (pathname.startsWith(baseURLTrailing)) {
    }

    return;
  });
}
