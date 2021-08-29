import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';

import { onIntegrationRegister } from './integrations';

import type { EZPlugin, PickRequired } from 'graphql-ez';
import type { RenderOptions } from 'altair-static-slim';
import type { AltairOptions, HandlerConfig, IDEHandler } from './types';

const AltairDeps = LazyPromise(async () => {
  const [
    { getDistDirectory, renderAltair },
    {
      promises: { readFile },
    },
    { resolve },
    { lookup },
  ] = await Promise.all([import('altair-static-slim'), import('fs'), import('path'), import('mime-types')]);

  return {
    getDistDirectory,
    renderAltair,
    readFile,
    resolve,
    lookup,
  };
});

export function AltairHandlerDeps(options: AltairOptions): {
  path: string;
  baseURL: string;
  renderOptions: RenderOptions;
  deps: typeof AltairDeps;
} {
  let { path = '/altair', baseURL: baseURLOpt, ...renderOptions } = options;

  const baseURL = baseURLOpt || path + '/';

  return {
    path,
    baseURL,
    renderOptions,
    deps: AltairDeps,
  };
}

export const ezAltairIDE = (options: AltairOptions | boolean = true): EZPlugin => {
  console.log('static!!');
  return {
    name: 'Altair GraphQL Client IDE',
    compatibilityList: ['fastify', 'express', 'hapi', 'http', 'koa', 'nextjs', 'sveltekit'],
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...getObjectValue(options) };

      objOptions.endpointURL ||= ctx.options.path;

      objOptions.path &&= withoutTrailingSlash(objOptions.path);
      objOptions.baseURL &&= withTrailingSlash(objOptions.baseURL);

      const path = (objOptions.path ||= '/altair');
      const baseURL = (objOptions.baseURL ||= withTrailingSlash(path));

      ctx.altair = {
        handler: AltairHandler,
        options: objOptions,
        path,
        baseURL,
      };
    },
    onIntegrationRegister,
  };
};

export function AltairHandler(options: PickRequired<AltairOptions, 'path'>, extraConfig?: HandlerConfig): IDEHandler {
  const { path, baseURL, renderOptions } = AltairHandlerDeps(options);

  const rawHttp = extraConfig?.rawHttp ?? true;

  return async function (req, res) {
    try {
      const { renderAltair, getDistDirectory, readFile, resolve, lookup } = await AltairDeps;

      switch (req.url) {
        case path:
        case baseURL: {
          const content = renderAltair({
            ...renderOptions,
            baseURL,
          });

          if (rawHttp) {
            res.setHeader('content-type', 'text/html');
            res.end(content);
          }

          return {
            content,
            contentType: 'text/html',
          };
        }
        case undefined: {
          if (rawHttp) {
            res.writeHead(404).end();
          }

          return;
        }
        default: {
          const resolvedPath = resolve(getDistDirectory(), req.url.slice(baseURL.length));

          const result = await readFile(resolvedPath).catch(() => {});

          const contentType = lookup(resolvedPath);

          if (!result || !contentType) {
            if (rawHttp) {
              res.writeHead(404).end();
            }

            return;
          }

          if (rawHttp) {
            res.setHeader('content-type', contentType);

            res.end(result);
          }

          return {
            content: result,
            contentType,
          };
        }
      }
    } catch (err: any) /* istanbul ignore next */ {
      if (rawHttp) {
        res
          .writeHead(500, {
            'content-type': 'application/json',
          })
          .end(
            JSON.stringify({
              message: err.message,
            })
          );
      }
    }

    return;
  };
}
