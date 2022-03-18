import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { AltairConfigOptions, RenderOptions } from 'altair-static-slim';
import crossFetch from 'cross-fetch';
import type { AltairRender } from '../types';

export const altairUnpkgDist = 'https://unpkg.com/altair-static@4.3.1/build/dist/';

function getObjectPropertyForOption(option: any, propertyName: keyof AltairConfigOptions) {
  if (option) {
    switch (typeof option) {
      case 'object':
        return `${propertyName}: ${JSON.stringify(option)},`;
    }
    return `${propertyName}: \`${option}\`,`;
  }
  return '';
}

const getRenderedAltairOpts = (renderOptions: RenderOptions, keys: (keyof AltairConfigOptions)[]) => {
  const optProps = Object.keys(renderOptions)
    .filter((key: any): key is keyof AltairConfigOptions => keys.includes(key))
    .map(key => getObjectPropertyForOption(renderOptions[key], key));

  return ['{', ...optProps, '}'].join('\n');
};

/**
 * Render Altair Initial options as a string using the provided renderOptions
 * @param renderOptions
 */
export const renderInitialOptions = (options: RenderOptions = {}) => {
  return `
          AltairGraphQL.init(${getRenderedAltairOpts(options, [
            'endpointURL',
            'subscriptionsEndpoint',
            'initialQuery',
            'initialVariables',
            'initialPreRequestScript',
            'initialPostRequestScript',
            'initialHeaders',
            'initialEnvironments',
            'instanceStorageNamespace',
            'initialSettings',
            'initialSubscriptionsProvider',
            'initialSubscriptionsPayload',
            'preserveState',
            'initialHttpMethod',
          ])});
      `;
};

const fetchFn = typeof fetch !== 'undefined' ? fetch : crossFetch;

/**
 * Render Altair as a string using the provided renderOptions
 * @param renderOptions
 */
export const renderAltair = async (options: RenderOptions = {}) => {
  const altairHtml = await (await fetchFn(altairUnpkgDist + 'index.html')).text();

  const initialOptions = renderInitialOptions(options);
  const baseURL = options.baseURL || './';
  if (options.serveInitialOptionsInSeperateRequest) {
    return altairHtml
      .replace(/<base.*>/, `<base href="${baseURL}">`)
      .replace('</body>', `<script src="initial_options.js"></script></body>`);
  } else {
    return altairHtml
      .replace(/<base.*>/, `<base href="${baseURL}">`)
      .replace('</body>', `<script>${initialOptions}</script></body>`);
  }
};

export const UnpkgRender: AltairRender = async ({ baseURL, url, altairPath, renderOptions, raw }) => {
  switch (url && withoutTrailingSlash(new URL(url, 'http://_').pathname)) {
    case withoutTrailingSlash(altairPath):
    case withoutTrailingSlash(baseURL):
      return {
        status: 200,
        contentType: 'text/html',
        content: await renderAltair({ ...renderOptions, baseURL: withTrailingSlash(baseURL) }),
        isBasePath: true,
      };
    default:
      if (!url) return { status: 404, isBasePath: false };

      const resolvedPath = altairUnpkgDist + url.slice(baseURL.length);

      const fetchResult = await fetchFn(resolvedPath).catch(() => null);

      if (!fetchResult) return { status: 404, isBasePath: false };

      const result = await fetchResult.arrayBuffer().catch(() => null);

      const contentType = fetchResult.headers.get('content-type');

      if (!contentType || !result) return { status: 404, isBasePath: false };

      const content = raw ? undefined : Buffer.from(result);

      return {
        status: 200,
        contentType,
        content,
        rawContent: raw ? result : undefined,
        isBasePath: false,
      };
  }
};
