import type { Package } from '@guild-docs/server/npm';

export const TagsList = [
  'transport',
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
  'sveltekit',
] as const;

export type Tags = typeof TagsList[number];

declare module '@guild-docs/server/npm' {
  interface Package {
    descriptionMarkdown?: string;
    additionalPackages?: string[];
    additionalDevPackages?: string[];
  }
}

function getTags(tagsHash: Partial<Record<Tags, 1>> | '*'): Tags[] {
  return Object.keys(tagsHash) as Tags[];
}

export const pluginsList: Package<Tags>[] = [
  {
    identifier: 'altair',
    npmPackage: '@graphql-ez/plugin-altair',
    tags: getTags({
      ide: 1,
      client: 1,
      introspection: 1,
      fastify: 1,
      express: 1,
      hapi: 1,
      koa: 1,
      http: 1,
      nextjs: 1,
      sveltekit: 1,
      cloudflare: 1,
    }),
    title: 'Altair GraphQL Client IDE',
    iconUrl: '/assets/logos/altair.png',
  },
  {
    identifier: 'upload',
    npmPackage: '@graphql-ez/plugin-upload',
    tags: getTags({
      transport: 1,
      codegen: 1,
      fastify: 1,
      koa: 1,
      express: 1,
    }),
    title: 'GraphQL Upload',
    iconUrl: '/assets/logos/upload.svg',
    additionalPackages: ['graphql-upload'],
    additionalDevPackages: ['@types/graphql-upload'],
  },
  {
    identifier: 'websockets',
    npmPackage: '@graphql-ez/plugin-websockets',
    tags: getTags({
      transport: 1,
      fastify: 1,
      express: 1,
      koa: 1,
      hapi: 1,
      http: 1,
    }),
    title: 'Websockets',
    iconUrl: '/assets/logos/graphql-ws.png',
    descriptionMarkdown: `
Integration of Websockets using [graphql-ws](https://github.com/enisdenjo/graphql-ws) and legacy support of [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws)
    `.trim(),
  },
  {
    identifier: 'graphiql',
    npmPackage: '@graphql-ez/plugin-graphiql',
    tags: getTags({
      client: 1,
      ide: 1,
      introspection: 1,
      codegen: 1,
      express: 1,
      fastify: 1,
      hapi: 1,
      http: 1,
      koa: 1,
      nextjs: 1,
      sveltekit: 1,
      cloudflare: 1,
    }),
    title: 'GraphiQL IDE',
    iconUrl: '/assets/logos/graphql.png',
  },
  {
    identifier: 'codegen',
    npmPackage: '@graphql-ez/plugin-codegen',
    tags: getTags({
      codegen: 1,
      schema: 1,
      express: 1,
      fastify: 1,
      hapi: 1,
      http: 1,
      koa: 1,
      nextjs: 1,
      sveltekit: 1,
    }),
    title: 'GraphQL Code Generator',
    iconUrl: '/assets/logos/code-generator.svg',
  },
  {
    identifier: 'voyager',
    npmPackage: '@graphql-ez/plugin-voyager',
    tags: getTags({
      introspection: 1,
      express: 1,
      fastify: 1,
      koa: 1,
      hapi: 1,
      http: 1,
      nextjs: 1,
      sveltekit: 1,
    }),
    title: 'GraphQL Voyager',
    iconUrl: '/assets/logos/voyager.png',
  },
  {
    identifier: 'graphql-modules',
    npmPackage: '@graphql-ez/plugin-modules',
    tags: getTags({
      codegen: 1,
      schema: 1,
      express: 1,
      fastify: 1,
      hapi: 1,
      http: 1,
      koa: 1,
      nextjs: 1,
      sveltekit: 1,
    }),
    title: 'GraphQL Modules',
    iconUrl: '/assets/logos/modules.svg',
  },
  {
    identifier: 'graphql-scalars',
    npmPackage: '@graphql-ez/plugin-scalars',
    tags: getTags({
      schema: 1,
      express: 1,
      fastify: 1,
      hapi: 1,
      http: 1,
      koa: 1,
      nextjs: 1,
      sveltekit: 1,
      cloudflare: 1,
    }),
    title: 'GraphQL Scalars',
    iconUrl: '/assets/logos/scalars.svg',
  },
  {
    identifier: 'dataloader',
    npmPackage: '@graphql-ez/plugin-dataloader',
    tags: getTags({
      schema: 1,
      express: 1,
      fastify: 1,
      hapi: 1,
      http: 1,
      koa: 1,
      nextjs: 1,
      sveltekit: 1,
      cloudflare: 1,
    }),
    title: 'DataLoader',
    iconUrl: '/assets/logos/graphql.png',
  },
  {
    identifier: 'schema',
    npmPackage: '@graphql-ez/plugin-schema',
    tags: getTags({
      schema: 1,
      codegen: 1,
      express: 1,
      fastify: 1,
      hapi: 1,
      http: 1,
      koa: 1,
      nextjs: 1,
      sveltekit: 1,
      cloudflare: 1,
    }),
    title: 'Schema',
    iconUrl: '/assets/logos/tools.svg',
  },
  {
    identifier: 'sse',
    npmPackage: '@graphql-ez/plugin-sse',
    tags: getTags({
      transport: 1,
      express: 1,
      fastify: 1,
      hapi: 1,
      koa: 1,
      http: 1,
    }),
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
    tags: getTags({
      express: 1,
      fastify: 1,
      hapi: 1,
      http: 1,
      koa: 1,
      nextjs: 1,
      sveltekit: 1,
    }),
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
