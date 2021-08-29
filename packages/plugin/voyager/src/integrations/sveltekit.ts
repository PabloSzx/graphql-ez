import type { InternalAppBuildContext, InternalAppBuildIntegrationContext } from 'graphql-ez';

export async function handleSvelteKit(
  ctx: InternalAppBuildContext,
  instance: NonNullable<InternalAppBuildIntegrationContext['sveltekit']>
) {
  if (!ctx.voyager) return;

  const html = await ctx.voyager.render();

  const path = ctx.voyager.path;

  instance.handlers.push(req => {
    if (req.method !== 'GET' || path !== req.path) return;

    return {
      status: 200,
      headers: {
        'content-type': 'text/html',
      },
      body: html,
    };
  });
}
