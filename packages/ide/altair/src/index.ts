import { LazyPromise } from '@graphql-ez/core-utils/promise';

import type { EZPlugin, RequestHandler } from '@graphql-ez/core-types';
import type { RenderOptions } from 'altair-static';
import type { AltairOptions } from './types';

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

declare module '@graphql-ez/core-types' {
  interface InternalAppBuildContext {
    altairHandler?: typeof AltairHandler;
  }

  interface AppOptions {
    altair?: AltairOptions | boolean;
  }
}

export const AltairIDE = (options: AltairOptions | boolean): EZPlugin => {
  return {
    onRegister(ctx) {
      ctx.altairHandler = AltairHandler;
      (ctx.options.ide ||= {}).altair = options;
    },
  };
};

export function AltairHandler(options: AltairOptions | true): RequestHandler {
  const { path, baseURL, renderOptions } = AltairHandlerDeps(typeof options === 'object' ? options : {});

  return async function (req, res) {
    try {
      const { renderAltair, getDistDirectory, readFile, resolve, lookup } = await AltairDeps;

      switch ((req.url ||= '_')) {
        case path:
        case baseURL: {
          res.setHeader('content-type', 'text/html');
          return res.end(
            renderAltair({
              ...renderOptions,
              baseURL,
            })
          );
        }
        default: {
          const resolvedPath = resolve(getDistDirectory(), req.url.slice(baseURL.length));

          const result = await readFile(resolvedPath).catch(() => {});

          if (!result) return res.writeHead(404).end();

          const contentType = lookup(resolvedPath);
          if (contentType) res.setHeader('content-type', contentType);
          return res.end(result);
        }
      }
    } catch (err) /* istanbul ignore next */ {
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
  };
}
