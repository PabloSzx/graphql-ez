import { getObjectValue } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import { onIntegrationRegister } from './integrations';

import type { EZPlugin } from '@graphql-ez/core-types';
import type { RenderOptions } from 'altair-static';
import type { AltairOptions, HandlerConfig, IDEHandler } from './types';

const AltairDeps = LazyPromise(async () => {
  const [
    { getDistDirectory, renderAltair },
    {
      promises: { readFile },
    },
    { resolve },
    { lookup },
  ] = await Promise.all([import('altair-static'), import('fs'), import('path'), import('mime-types')]);

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
  let { path = '/altair', ...renderOptions } = options;

  const baseURL = path.endsWith('/') ? (path = path.slice(0, path.length - 1)) + '/' : path + '/';

  return {
    path,
    baseURL,
    renderOptions,
    deps: AltairDeps,
  };
}

export const ezAltairIDE = (options: AltairOptions | boolean = true): EZPlugin => {
  return {
    name: 'Altair GraphQL Client IDE',
    compatibilityList: ['fastify-new', 'express-new', 'hapi-new', 'http-new', 'koa-new', 'nextjs-new'],
    onRegister(ctx) {
      if (!options) return;

      const objOptions = { ...(getObjectValue(options) || {}) };

      objOptions.endpointURL ||= ctx.options.path;

      const path = (objOptions.path ||= '/altair');

      const baseURL = (objOptions.baseURL ||= '/altair/');

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

export function AltairHandler(options: AltairOptions | boolean, extraConfig?: HandlerConfig): IDEHandler {
  const { path, baseURL, renderOptions } = AltairHandlerDeps(getObjectValue(options) || {});

  const rawHttp = extraConfig?.rawHttp ?? true;

  return async function (req, res) {
    try {
      const { renderAltair, getDistDirectory, readFile, resolve, lookup } = await AltairDeps;

      switch ((req.url ||= '_')) {
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
    } catch (err) /* istanbul ignore next */ {
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
