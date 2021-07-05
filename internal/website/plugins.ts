import type { Package } from '@guild-docs/server/npm';

export type Tags = 'ide' | 'client' | 'fastify-compatible' | 'koa-compatible';

declare module '@guild-docs/server/npm' {
  interface Package {
    additionalPackages?: string[];
    additionalDevPackages?: string[];
  }
}

export const pluginsList: Package<Tags>[] = [
  {
    identifier: 'altair',
    npmPackage: '@graphql-ez/plugin-altair',
    tags: ['ide', 'client'],
    title: 'Altair GraphQL Client IDE',
    iconUrl: '/assets/logos/altair.png',
  },
  {
    identifier: 'upload',
    npmPackage: '@graphql-ez/plugin-upload',
    tags: ['fastify-compatible', 'koa-compatible'],
    title: 'GraphQL Upload',
    iconUrl: '/assets/logos/upload.svg',
    additionalPackages: ['graphql-upload'],
    additionalDevPackages: ['@types/graphql-upload'],
  },
];

export function packageInstallList(pkg: Package): string[] {
  return [
    pkg.additionalPackages ? [pkg.npmPackage, ...pkg.additionalPackages].join(' ') : pkg.npmPackage,
    ...(pkg.additionalDevPackages ? ['-D ' + pkg.additionalDevPackages.join(' ')] : []),
  ];
}
