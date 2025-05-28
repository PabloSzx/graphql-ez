import { LazyPromise } from '@graphql-ez/utils/promise';
import { DocumentNode, print } from 'graphql';
import { IncomingHttpHeaders } from 'http';

export const lazyDeps = LazyPromise(() => import('./deps.js'));

const DocumentPrintCache = new WeakMap<DocumentNode, string>();

export function getQueryString(document: DocumentNode | string): string {
  if (typeof document === 'string') return document;

  let queryString = DocumentPrintCache.get(document);

  if (queryString == null) {
    queryString = print(document);
    DocumentPrintCache.set(document, queryString);
  }

  return queryString;
}

export function incomingHeadersToHeadersInit(incomingHeaders: IncomingHttpHeaders): HeadersInit {
  const headersInit: HeadersInit = {};
  for (const name in incomingHeaders) {
    const value = incomingHeaders[name];
    if (value !== undefined) {
      // Convert array values to a comma-separated string
      headersInit[name] = Array.isArray(value) ? value.join(',') : value;
    }
  }
  return headersInit;
}
