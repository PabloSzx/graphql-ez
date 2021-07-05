import type { Package } from '@guild-docs/server/npm';

export type Tags =
  | 'ide'
  | 'client'
  | 'codegen'
  | 'introspection'
  | 'schema-building'
  | 'fastify-compatible'
  | 'koa-compatible'
  | 'express-compatible'
  | 'hapi-compatible'
  | 'node-http-compatible'
  | 'nextjs-compatible';

declare module '@guild-docs/server/npm' {
  interface Package {
    restrictedCompatibility?: boolean;
    descriptionMarkdown?: string;
    additionalPackages?: string[];
    additionalDevPackages?: string[];
  }
}

export const pluginsList: Package<Tags>[] = [
  {
    identifier: 'altair',
    npmPackage: '@graphql-ez/plugin-altair',
    tags: ['ide', 'client', 'introspection'],
    title: 'Altair GraphQL Client IDE',
    iconUrl: '/assets/logos/altair.png',
  },
  {
    identifier: 'upload',
    npmPackage: '@graphql-ez/plugin-upload',
    tags: ['codegen', 'fastify-compatible', 'koa-compatible', 'express-compatible'],
    title: 'GraphQL Upload',
    iconUrl: '/assets/logos/upload.svg',
    additionalPackages: ['graphql-upload'],
    additionalDevPackages: ['@types/graphql-upload'],
    restrictedCompatibility: true,
  },
  {
    identifier: 'websockets',
    npmPackage: '@graphql-ez/plugin-websockets',
    tags: ['fastify-compatible', 'express-compatible', 'koa-compatible', 'hapi-compatible', 'node-http-compatible'],
    title: 'Websockets',
    iconUrl: '/assets/logos/graphql-ws.png',
    descriptionMarkdown: `
Integration of Websockets using [graphql-ws](https://github.com/enisdenjo/graphql-ws) and legacy support of [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws)
    `.trim(),
    restrictedCompatibility: true,
  },
  {
    identifier: 'graphiql',
    npmPackage: '@graphql-ez/plugin-graphiql',
    tags: ['client', 'ide', 'introspection'],
    title: 'GraphiQL IDE',
    iconUrl: '/assets/logos/graphql.png',
  },
  {
    identifier: 'codegen',
    npmPackage: '@graphql-ez/plugin-codegen',
    tags: ['codegen', 'schema-building'],
    title: 'GraphQL Code Generator',
    iconUrl: '/assets/logos/code-generator.svg',
  },
  {
    identifier: 'voyager',
    npmPackage: '@graphql-ez/plugin-voyager',
    tags: ['introspection'],
    title: 'GraphQL Voyager',
    iconUrl: '/assets/logos/voyager.png',
  },
  {
    identifier: 'GraphQL Modules',
    npmPackage: '@graphql-ez/plugin-modules',
    tags: ['codegen', 'schema-building'],
    title: 'GraphQL Modules',
    iconUrl: '/assets/logos/modules.svg',
  },
  {
    identifier: 'GraphQL Scalars',
    npmPackage: '@graphql-ez/plugin-scalars',
    tags: ['schema-building'],
    title: 'GraphQL Scalars',
    iconUrl: '/assets/logos/scalars.svg',
  },
  {
    identifier: 'dataloader',
    npmPackage: '@graphql-ez/plugin-dataloader',
    tags: ['schema-building'],
    title: 'DataLoader',
    iconUrl: '/assets/logos/graphql.png',
  },
];

export function packageInstallList(pkg: Package): string[] {
  return [
    pkg.additionalPackages ? [pkg.npmPackage, ...pkg.additionalPackages].join(' ') : pkg.npmPackage,
    ...(pkg.additionalDevPackages ? ['-D ' + pkg.additionalDevPackages.join(' ')] : []),
  ];
}
