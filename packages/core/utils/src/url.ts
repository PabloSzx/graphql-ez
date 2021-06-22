export function getPathname(path?: string): string | undefined {
  return path && new URL('http://_' + path).pathname;
}

export function withTrailingSlash(path: string) {
  return path.endsWith('/') ? path : path + '/';
}

export function withoutTrailingSlash(path: string) {
  return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}
