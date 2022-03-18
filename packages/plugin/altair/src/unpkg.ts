import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { EZPlugin, PickRequired } from 'graphql-ez';
import { onIntegrationRegister } from './integrations';
import type { AltairOptions, IDEHandler } from './types';

export function UnpkgAltairHandler(options: PickRequired<AltairOptions, 'path'>): IDEHandler {
  let { path, baseURL: baseURLOpt, endpoint = '/api/graphql', disableIf, ...renderOptions } = options;

  const baseURL = baseURLOpt || path + '/';

  return async function (req, res) {
    const { UnpkgRender } = await import('./render/unpkg');

    const { status, content, contentType, isBasePath } = await UnpkgRender({
      altairPath: path,
      baseURL,
      url: req.url,
      renderOptions: {
        ...renderOptions,
        baseURL,
        endpointURL: endpoint,
      },
    });

    if (isBasePath && disableIf?.(req)) {
      res.writeHead(404).end();

      return;
    }

    if (contentType) res.setHeader('content-type', contentType);
    res.writeHead(status).end(content);
  };
}

export const ezUnpkgAltairIDE = (options: AltairOptions | boolean = true): EZPlugin => {
  return {
    name: 'Altair GraphQL Client UNPKG',
    compatibilityList: {
      fastify: true,
      express: true,
      hapi: true,
      http: true,
      koa: true,
      nextjs: true,
      sveltekit: true,
      vercel: true,
      cloudflare: true,
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
        handler: UnpkgAltairHandler,
        options: objOptions,
        path,
        baseURL,
        render: LazyPromise(async () => {
          return (await import('./render/unpkg')).UnpkgRender;
        }),
      };
    },
    onIntegrationRegister,
  };
};
