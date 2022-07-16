import { LazyPromise } from '@graphql-ez/utils/promise';
import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { AltairRender } from '../types';

export function getDefault<T>(pkg: T & { default?: T }): T {
  return pkg.default || pkg;
}

const AltairDeps = LazyPromise(async () => {
  const [
    { getDistDirectory, renderAltair },
    {
      promises: { readFile },
    },
    { resolve },
    { lookup },
  ] = await Promise.all([import('altair-static-slim').then(getDefault), import('fs'), import('path'), import('mime-types')]);

  return {
    getDistDirectory,
    renderAltair,
    readFile,
    resolve,
    lookup,
  };
});

export const StaticRender: AltairRender = async ({ baseURL, url, altairPath, renderOptions }) => {
  const { renderAltair, getDistDirectory, resolve, readFile, lookup } = await AltairDeps;

  switch (url && withoutTrailingSlash(new URL(url, 'http://_').pathname)) {
    case withoutTrailingSlash(altairPath):
    case withoutTrailingSlash(baseURL):
      return {
        status: 200,
        contentType: 'text/html',
        content: renderAltair({ ...renderOptions, baseURL: withTrailingSlash(baseURL) }),
        isBasePath: true,
      };
    default:
      if (!url) return { status: 404, isBasePath: false };

      const resolvedPath = resolve(getDistDirectory(), url.slice(baseURL.length));

      const result = await readFile(resolvedPath).catch(() => {});

      const contentType = lookup(resolvedPath);

      if (!contentType || !result) return { status: 404, isBasePath: false };

      return {
        status: 200,
        contentType,
        content: result,
        isBasePath: false,
      };
  }
};
