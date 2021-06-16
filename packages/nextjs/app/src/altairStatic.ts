import fetch from 'node-fetch';

import type { AltairConfigOptions } from 'altair-exported-types/dist/app/modules/altair/config';

export interface RenderOptions extends AltairConfigOptions {
  /**
   * URL to be used as a base for relative URLs
   */
  baseURL?: string;

  /**
   * Whether to render the initial options in a seperate javascript file or not.
   * Use this to be able to enforce strict CSP rules.
   * @default false
   */
  serveInitialOptionsInSeperateRequest?: boolean;
}

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
  const altairHtml = await (await fetch('https://unpkg.com/altair-static@4.0.6/build/dist/index.html')).text();

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
