import { DocumentNode, print } from 'graphql';

export function documentParamsToURIParams({
  query,
  variables,
  extensions,
  operationName,
}: {
  query: string | DocumentNode;
  variables?: unknown;
  extensions?: unknown;
  operationName?: string;
}) {
  return `?query=${encodeURIComponent(typeof query === 'string' ? query : print(query))}${
    variables ? '&variables=' + encodeURIComponent(typeof variables === 'string' ? variables : JSON.stringify(variables)) : ''
  }${operationName ? '&operationName=' + encodeURIComponent(operationName) : ''}${
    extensions
      ? '&extensions=' + encodeURIComponent(typeof extensions === 'string' ? extensions : JSON.stringify(extensions))
      : ''
  }`;
}
