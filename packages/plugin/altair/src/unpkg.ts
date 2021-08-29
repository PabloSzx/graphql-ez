import fetch from 'node-fetch';

import { getObjectValue } from '@graphql-ez/utils/object';
import { withoutTrailingSlash, withTrailingSlash } from '@graphql-ez/utils/url';

import { onIntegrationRegister } from './integrations';

import type { EZPlugin, PickRequired } from 'graphql-ez';
import type { RenderOptions, AltairConfigOptions } from 'altair-static-slim';
import type { AltairOptions, HandlerConfig, IDEHandler } from './types';

export const altairUnpkgDist = 'https://unpkg.com/altair-static@4.0.9/build/dist/';

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

const getRenderedAltairOpts = (renderOptions: RenderOptions, keys: (keyof AltairConfigOptions)[]) => {
  const optProps = Object.keys(renderOptions)
    .filter((key: any): key is keyof AltairConfigOptions => keys.includes(key))
    .map(key => getObjectPropertyForOption(renderOptions[key], key));

  return ['{', ...optProps, '}'].join('\n');
};
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

export function UnpkgAltairHandler(options: PickRequired<AltairOptions, 'path'>, extraConfig?: HandlerConfig): IDEHandler {
  let { path, baseURL: baseURLOpt, endpointURL = '/api/graphql', ...renderOptions } = options;

  const baseURL = baseURLOpt || path + '/';

  const rawHttp = extraConfig?.rawHttp ?? true;

  return async function (req, res) {
    switch (req.url) {
      case path:
      case baseURL: {
        const content = await renderAltair({
          ...renderOptions,
          baseURL,
          endpointURL,
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
        const resolvedPath = altairUnpkgDist + req.url.slice(baseURL.length);

        const fetchResult = await fetch(resolvedPath).catch(() => null);

        if (!fetchResult) {
          if (rawHttp) {
            res.writeHead(404).end();
          }

          return;
        }

        const result = await fetchResult.arrayBuffer().catch(() => null);

        const contentType = fetchResult.headers.get('content-type');

        if (!result || !contentType) {
          if (rawHttp) {
            res.writeHead(404).end();
          }
          return;
        }

        const content = Buffer.from(result);

        if (rawHttp) {
          res.setHeader('content-type', contentType);
          res.end(content);
        }

        return {
          content,
          contentType,
        };
      }
    }
  };
}

export const ezUnpkgAltairIDE = (options: AltairOptions | boolean = true): EZPlugin => {
  return {
    name: 'Altair GraphQL Client UNPKG',
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
        handler: UnpkgAltairHandler,
        options: objOptions,
        path,
        baseURL,
      };
    },
    onIntegrationRegister,
  };
};
