export const isHttpMethod = (target: 'GET' | 'POST', subject: string): boolean => {
  return subject.toUpperCase() === target;
};

export const shouldRenderGraphiQL = ({
  headers,
  method,
  query,
}: {
  headers: Headers | Record<string, unknown>;
  method: string;
  query: Record<string, unknown>;
}): boolean => {
  const accept = typeof headers.get === 'function' ? headers.get('accept') : (headers as Record<string, unknown>).accept;

  return (
    isHttpMethod('GET', method) && accept?.includes('text/html') && (!!query.share || !(query['query'] || query['extensions']))
  );
};

export { getPathname } from '@graphql-ez/utils/url';
