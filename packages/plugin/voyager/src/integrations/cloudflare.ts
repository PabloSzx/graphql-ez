import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export async function handleCloudflare(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['cloudflare']>
) {
  if (!ctx.voyager) return;

  const html = await ctx.voyager.render();

  instance.router.add('GET', ctx.voyager.path, (_req, res) => {
    res.setHeader('content-type', 'text/html');
    res.end(html);
  });
}
