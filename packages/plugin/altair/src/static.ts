import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { EZPlugin, PickRequired } from 'graphql-ez';
import { onIntegrationRegister } from './integrations';
import type { AltairOptions, IDEHandler } from './types';

export function AltairHandlerDeps(options: AltairOptions) {
  let { path = '/altair', baseURL: baseURLOpt, endpoint: endpointURL, disableIf, ...renderOptions } = options;

  const baseURL = baseURLOpt || path + '/';

  return {
    path,
    baseURL,
    disableIf,
    renderOptions: {
      ...renderOptions,
      endpointURL,
      baseURL,
    },
  };
}

export const ezAltairIDE = (options: AltairOptions | boolean = true): EZPlugin => {
  return {
    name: 'Altair GraphQL Client IDE',
    compatibilityList: {
      fastify: true,
      express: true,
      hapi: true,
      http: true,
      koa: true,
      nextjs: true,
      sveltekit: true,
      vercel: true,
      cloudflare: Error("[graphql-ez] Change 'ezAltairIDE' to 'ezUnpkgAltairIDE' for Cloudflare workers"),
    },
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...getObjectValue(options) };

      objOptions.endpoint ||= ctx.options.path;

      objOptions.path &&= withoutTrailingSlash(objOptions.path);
      objOptions.baseURL &&= withTrailingSlash(objOptions.baseURL);

      const path = (objOptions.path ||= '/altair');
      const baseURL = (objOptions.baseURL ||= withTrailingSlash(path));

      ctx.altair = {
        handler: AltairHandler,
        options: objOptions,
        path,
        baseURL,
        render: LazyPromise(async () => {
          return (await import('./render/static')).StaticRender;
        }),
      };
    },
    onIntegrationRegister,
  };
};

export function AltairHandler(options: PickRequired<AltairOptions, 'path'>): IDEHandler {
  const { path, baseURL, renderOptions, disableIf } = AltairHandlerDeps(options);

  return async function (req, res) {
    const { StaticRender } = await import('./render/static');

    const { status, content, contentType, isBasePath } = await StaticRender({
      altairPath: path,
      baseURL,
      url: req.url,
      renderOptions,
    });

    if (isBasePath && disableIf?.(req)) {
      res.writeHead(404).end();

      return;
    }

    if (contentType) res.setHeader('content-type', contentType);
    res.writeHead(status).end(content);
  };
}
