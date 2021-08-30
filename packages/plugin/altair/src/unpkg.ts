import { LazyPromise } from '@graphql-ez/utils/promise';
import { getObjectValue } from '@graphql-ez/utils/object';
import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';

import { onIntegrationRegister } from './integrations';

import type { EZPlugin, PickRequired } from 'graphql-ez';
import type { AltairOptions, IDEHandler } from './types';

export function UnpkgAltairHandler(options: PickRequired<AltairOptions, 'path'>): IDEHandler {
  let { path, baseURL: baseURLOpt, endpointURL = '/api/graphql', ...renderOptions } = options;

  const baseURL = baseURLOpt || path + '/';

  return async function (req, res) {
    const { UnpkgRender } = await import('./render/unpkg');

    const { status, content, contentType } = await UnpkgRender({
      altairPath: path,
      baseURL,
      url: req.url,
      renderOptions,
    });

    if (contentType) res.setHeader('content-type', contentType);
    res.writeHead(status);
    res.end(content);
  };
}

export const ezUnpkgAltairIDE = (options: AltairOptions | boolean = true): EZPlugin => {
  return {
    name: 'Altair GraphQL Client UNPKG',
    compatibilityList: ['fastify', 'express', 'hapi', 'http', 'koa', 'nextjs', 'sveltekit', 'cloudflare'],
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...getObjectValue(options) };

      objOptions.endpointURL ||= ctx.options.path;

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
