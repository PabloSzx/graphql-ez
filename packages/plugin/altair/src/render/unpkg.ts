import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';
import type { AltairConfigOptions, RenderOptions } from 'altair-static-slim';
import fetch from 'cross-fetch';
import type { AltairRender } from '../types';

export const altairUnpkgDist = 'https://unpkg.com/altair-static@4.0.9/build/dist/';

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

/**
 * Render Altair as a string using the provided renderOptions
 * @param renderOptions
 */
export const renderAltair = async (options: RenderOptions = {}) => {
  const altairHtml = await (await fetch(altairUnpkgDist + 'index.html')).text();

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

export const UnpkgRender: AltairRender = async ({
  baseURL,
  url,
  altairPath,
  renderOptions,
}): Promise<{
  status: number;
  contentType?: string;
  content?: string | Buffer;
}> => {
  switch (url && withoutTrailingSlash(url)) {
    case withoutTrailingSlash(altairPath):
    case withoutTrailingSlash(baseURL):
      return {
        status: 200,
        contentType: 'text/html',
        content: await renderAltair({ ...renderOptions, baseURL: withTrailingSlash(baseURL) }),
      };
    default:
      if (!url) return { status: 404 };

      const resolvedPath = altairUnpkgDist + url.slice(baseURL.length);

      const fetchResult = await fetch(resolvedPath).catch(() => null);

      if (!fetchResult) return { status: 404 };

      const result = await fetchResult.arrayBuffer().catch(() => null);

      const contentType = fetchResult.headers.get('content-type');

      if (!contentType || !result) return { status: 404 };

      const content = Buffer.from(result);

      return {
        status: 200,
        contentType,
        content,
      };
  }
};
