import type { Request } from 'graphql-ez';

export const isHttpMethod = (
  target: "GET" | "POST",
  subject: string
): boolean => {
  return subject.toUpperCase() === target;
};

export function getRequestBody(request: Request): Record<string, any> {
  const isPost = !request.method || isHttpMethod('POST', request.method);
  return (isPost ? request.body : request.query) ?? {};
}
