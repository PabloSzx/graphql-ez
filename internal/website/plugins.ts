import type { Package } from '@guild-docs/server/npm';

export const TagsList = [
  'ide',
  'client',
  'codegen',
  'introspection',
  'schema',
  'fastify',
  'koa',
  'express',
  'hapi',
  'http',
  'nextjs',
  'cloudflare',
  'universal',
] as const;

export type Tags = typeof TagsList[number];

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
    tags: ['codegen', 'fastify', 'koa', 'express'],
    title: 'GraphQL Upload',
    iconUrl: '/assets/logos/upload.svg',
    additionalPackages: ['graphql-upload'],
    additionalDevPackages: ['@types/graphql-upload'],
    restrictedCompatibility: true,
  },
  {
    identifier: 'websockets',
    npmPackage: '@graphql-ez/plugin-websockets',
    tags: ['fastify', 'express', 'koa', 'hapi', 'http'],
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
    tags: ['codegen', 'schema'],
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
    identifier: 'graphql-modules',
    npmPackage: '@graphql-ez/plugin-modules',
    tags: ['codegen', 'schema'],
    title: 'GraphQL Modules',
    iconUrl: '/assets/logos/modules.svg',
  },
  {
    identifier: 'graphql-scalars',
    npmPackage: '@graphql-ez/plugin-scalars',
    tags: ['schema'],
    title: 'GraphQL Scalars',
    iconUrl: '/assets/logos/scalars.svg',
  },
  {
    identifier: 'dataloader',
    npmPackage: '@graphql-ez/plugin-dataloader',
    tags: ['schema'],
    title: 'DataLoader',
    iconUrl: '/assets/logos/graphql.png',
  },
  {
    identifier: 'schema',
    npmPackage: '@graphql-ez/plugin-schema',
    tags: ['schema', 'codegen'],
    title: 'Schema',
    iconUrl: '/assets/logos/tools.svg',
  },
  {
    identifier: 'sse',
    npmPackage: '@graphql-ez/plugin-sse',
    tags: ['express', 'fastify', 'hapi', 'koa', 'http'],
    title: 'GraphQL over Server-Sent Events',
    iconUrl: '/assets/logos/graphql.png',
    githubReadme: {
      repo: 'PabloSzx/graphql-ez',
      path: 'packages/plugin/sse/README.md',
    },
  },
  {
    identifier: 'automatic-persisted-queries',
    npmPackage: '@graphql-ez/plugin-automatic-persisted-queries',
    tags: ['universal'],
    title: 'Automatic Persisted Queries',
    iconUrl: '/assets/logos/graphql.png',
    githubReadme: {
      repo: 'PabloSzx/graphql-ez',
      path: 'packages/plugin/automatic-persisted-queries/README.md',
    },
  },
];

export function packageInstallList(pkg: Package): string[] {
  return [
    pkg.additionalPackages ? [pkg.npmPackage, ...pkg.additionalPackages].join(' ') : pkg.npmPackage,
    ...(pkg.additionalDevPackages ? ['-D ' + pkg.additionalDevPackages.join(' ')] : []),
  ];
}
