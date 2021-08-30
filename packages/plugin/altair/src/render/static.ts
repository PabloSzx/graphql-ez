import { LazyPromise } from '@graphql-ez/utils/promise';
import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { AltairRender } from '../types';

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

export const StaticRender: AltairRender = async ({ baseURL, url, altairPath, renderOptions }) => {
  const { renderAltair, getDistDirectory, resolve, readFile, lookup } = await AltairDeps;

  switch (url && withoutTrailingSlash(url)) {
    case withoutTrailingSlash(altairPath):
    case withoutTrailingSlash(baseURL):
      return {
        status: 200,
        contentType: 'text/html',
        content: renderAltair({ ...renderOptions, baseURL: withTrailingSlash(baseURL) }),
      };
    default:
      if (!url) return { status: 404 };

      const resolvedPath = resolve(getDistDirectory(), url.slice(baseURL.length));

      const result = await readFile(resolvedPath).catch(() => {});

      const contentType = lookup(resolvedPath);

      if (!contentType || !result) return { status: 404 };

      return {
        status: 200,
        contentType,
        content: result,
      };
  }
};
