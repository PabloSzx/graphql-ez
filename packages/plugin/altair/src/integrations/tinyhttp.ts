import { withTrailingSlash } from '@graphql-ez/utils/url';

import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleTinyhttp(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['tinyhttp']>
) {
  if (!ctx.altair) return;

  const path = ctx.altair.path;

  const handler = ctx.altair.handler({ ...ctx.altair.options, path });

  instance.app
    .get(path, async (req, res) => {
      await handler(
        {
          url: req.originalUrl,
        },
        res
      );
    })
    .get(`${withTrailingSlash(ctx.altair.baseURL)}*`, async (req, res) => {
      await handler(
        {
          url: req.originalUrl,
        },
        res
      );
    });
}
