import { LazyPromise } from '@graphql-ez/utils/promise';
import { DocumentNode, print } from 'graphql';

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
