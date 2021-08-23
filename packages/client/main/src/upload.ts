import { LazyPromise } from '@graphql-ez/utils';
import { ReadStream } from 'fs';
import { print } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import type { QueryFunctionPost } from './';

export function createUploadQuery(
  endpoint: string,
  getHeaders: (headers?: IncomingHttpHeaders) => Record<string, any>,
  defaultQuery: QueryFunctionPost
): QueryFunctionPost {
  const deps = LazyPromise(async () => {
    const [{ default: fetch }, { extractFiles }, { default: FormData }] = await Promise.all([
      import('node-fetch'),
      import('extract-files'),
      import('form-data'),
    ]);

    return {
      fetch,
      extractFiles,
      FormData,
    };
  });

  return async function (document, { variables, headers: headersArg, extensions, operationName } = {}) {
    const { FormData, extractFiles, fetch } = await deps;

    const queryString = typeof document === 'string' ? document : print(document);

    const mainBody = {
      query: queryString,
      variables,
      operationName,
    };

    const extracted = extractFiles(mainBody, undefined, (value): value is ReadStream | Buffer | string => {
      return value instanceof ReadStream || value instanceof Buffer;
    });

    if (extracted.files.size) {
      const form = new FormData();
      form.append('operations', JSON.stringify({ ...extracted.clone, extensions }));

      const map: Record<number, string[]> = {};
      let i = 0;
      extracted.files.forEach(paths => {
        map[++i] = paths;
      });
      form.append('map', JSON.stringify(map));
      i = 0;
      extracted.files.forEach((_paths, file) => {
        form.append(++i + '', file);
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...getHeaders(headersArg), ...form.getHeaders() },
        body: form,
      });

      const json = await response.json();

      return json;
    }

    return defaultQuery(document, {
      extensions,
      headers: headersArg,
      operationName,
      variables,
    });
  };
}
