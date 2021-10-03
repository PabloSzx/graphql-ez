import { ezSchema, EZSchemaOptions } from '@graphql-ez/plugin-schema';
import { LazyPromise, PLazy } from '@graphql-ez/utils/promise';
import { jest } from '@jest/globals';
import getPort from 'get-port';
import type { AppOptions, BuildAppOptions } from 'graphql-ez';
import defaultsDeep from 'lodash/defaultsDeep.js';
import { resolve } from 'path';
import { TearDownPromises } from './common';
import './graphiqlBundle';
import { getRequestPool } from './request';
import {
  createGraphQLWSWebsocketsClient,
  createSubscriptionsTransportWebsocketsClient,
  GraphQLWSClientOptions,
  SubscriptionsTransportClientOptions,
} from './ws';

globalThis.jest ||= jest as any;

export type {} from '@graphql-typed-document-node/core';
export type {} from 'express-serve-static-core';
export type {} from 'graphql';
export * from 'graphql-ez';
export type {} from 'graphql-ws';
export type {} from 'subscriptions-transport-ws-envelop';
export type {} from 'undici/types/dispatcher';
export { default as waitForExpect } from 'wait-for-expect';
export * from './common';
export * from './request';
export * from './schema';
export * from './testQueryStream';
export * from './testServerSideEvents';
export * from './upload';
export * from './ws';

export interface StartTestServerOptions<CreateOptions extends AppOptions, BuildOptions extends BuildAppOptions> {
  createOptions?: Omit<CreateOptions, 'schema'> & EZSchemaOptions;
  buildOptions?: Partial<BuildOptions>;

  graphqlWsClientOptions?: Partial<GraphQLWSClientOptions>;
  /**
   * @default "/graphql"
   */
  clientWebsocketPath?: string;
  subscriptionsTransportClientOptions?: Partial<SubscriptionsTransportClientOptions>;

  /**
   * @default true
   */
  autoClose?: boolean;
}

export const startFastifyServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  clientWebsocketPath,
  autoClose = true,
}: StartTestServerOptions<import('@graphql-ez/fastify').FastifyAppOptions, import('@graphql-ez/fastify').BuildAppOptions>) => {
  const server = (await import('fastify')).default();

  const { CreateApp } = await import('@graphql-ez/fastify');

  const { schema, mergeSchemasConfig, ...opts } = createOptions || {};

  if (schema) {
    defaultsDeep(opts, {
      ez: {
        plugins: [],
      },
    } as AppOptions);

    opts.ez?.plugins?.push(ezSchema({ schema, mergeSchemasConfig }));
  }

  const appBuilder = CreateApp({ ...opts });

  const ezApp = appBuilder.buildApp(buildOptions);

  await server.register(ezApp.fastifyPlugin);

  await server.ready();

  const port = await getPort();

  await new Promise<unknown>((resolve, reject) => {
    server.listen(port).then(resolve, reject);

    autoClose && TearDownPromises.push(new PLazy<void>(resolve => server.close(resolve)));
  });

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    server,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, clientWebsocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      clientWebsocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export const startExpressServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  clientWebsocketPath,
  autoClose = true,
}: StartTestServerOptions<
  import('@graphql-ez/express').ExpressAppOptions,
  import('@graphql-ez/express').ExpressBuildAppOptions
>) => {
  const server = (await import('express')).default();

  const { CreateApp } = await import('@graphql-ez/express');

  const { schema, mergeSchemasConfig, ...opts } = createOptions || {};

  if (schema) {
    defaultsDeep(opts, {
      ez: {
        plugins: [],
      },
    } as AppOptions);

    opts.ez?.plugins?.push(ezSchema({ schema, mergeSchemasConfig }));
  }

  const appBuilder = CreateApp(opts);

  const ezApp = await appBuilder.buildApp({ ...buildOptions, app: server });

  server.use(ezApp.router);

  const port = await getPort();

  await new Promise<void>(resolve => {
    const httpServer = server.listen(port, () => {
      resolve();
    });

    autoClose && TearDownPromises.push(new PLazy<unknown>(resolve => httpServer.close(resolve)));
  });

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    server,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, clientWebsocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      clientWebsocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export async function startHTTPServer({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  clientWebsocketPath,
  autoClose = true,
}: StartTestServerOptions<import('@graphql-ez/http').HttpAppOptions, import('@graphql-ez/http').HTTPBuildAppOptions>) {
  const { CreateApp } = await import('@graphql-ez/http');

  const { schema, mergeSchemasConfig, ...opts } = createOptions || {};

  if (schema) {
    defaultsDeep(opts, {
      ez: {
        plugins: [],
      },
    } as AppOptions);

    opts.ez?.plugins?.push(ezSchema({ schema, mergeSchemasConfig }));
  }
  const appBuilder = CreateApp(opts);

  const server = (await import('http')).createServer((req, res) => {
    ezApp.requestHandler(req, res);
  });

  const ezApp = appBuilder.buildApp({ ...buildOptions, server });

  const port = await getPort();

  await new Promise<void>(resolve => {
    server.listen(port, () => {
      resolve();
    });

    autoClose &&
      TearDownPromises.push(
        new PLazy<void>((resolve, reject) =>
          server.close(err => {
            if (err) return reject(err);
            resolve();
          })
        )
      );
  });

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    server,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, clientWebsocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      clientWebsocketPath,
      subscriptionsTransportClientOptions
    ),
  };
}

export const startHapiServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  clientWebsocketPath,
  autoClose = true,
}: StartTestServerOptions<import('@graphql-ez/hapi').HapiAppOptions, import('@graphql-ez/hapi').BuildAppOptions>) => {
  const port = await getPort();

  const server = (await import('@hapi/hapi')).server({
    port,
    host: 'localhost',
  });

  const { CreateApp } = await import('@graphql-ez/hapi');

  const { schema, mergeSchemasConfig, ...opts } = createOptions || {};

  if (schema) {
    defaultsDeep(opts, {
      ez: {
        plugins: [],
      },
    } as AppOptions);

    opts.ez?.plugins?.push(ezSchema({ schema, mergeSchemasConfig }));
  }
  const appBuilder = CreateApp(opts);

  const ezApp = await appBuilder.buildApp(buildOptions);

  await server.register(ezApp.hapiPlugin);

  await server.start();

  autoClose &&
    TearDownPromises.push(
      LazyPromise(async () => {
        await server.stop();
      })
    );

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    server,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, clientWebsocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      clientWebsocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export const startKoaServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  clientWebsocketPath,
  autoClose = true,
}: StartTestServerOptions<import('@graphql-ez/koa').KoaAppOptions, import('@graphql-ez/koa').KoaBuildAppOptions>) => {
  const Koa = (await import('koa')).default;
  const KoaRouter = (await import('@koa/router')).default;

  const server = new Koa();

  const router = new KoaRouter();

  const { CreateApp } = await import('@graphql-ez/koa');

  const { schema, mergeSchemasConfig, ...opts } = createOptions || {};

  if (schema) {
    defaultsDeep(opts, {
      ez: {
        plugins: [],
      },
    } as AppOptions);

    opts.ez?.plugins?.push(ezSchema({ schema, mergeSchemasConfig }));
  }
  const appBuilder = CreateApp(opts);

  const ezApp = await appBuilder.buildApp({ ...buildOptions, app: server, router });

  server.use(router.routes()).use(router.allowedMethods());

  const port = await getPort();

  await new Promise<void>(resolve => {
    const httpServer = server.listen(port, resolve);

    autoClose && TearDownPromises.push(new PLazy(resolve => httpServer.close(resolve)));
  });

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    server,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, clientWebsocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      clientWebsocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export async function startNextJSServer(dir: string[], autoClose: boolean = true) {
  const app = (await import('fastify')).default({
    pluginTimeout: 20000,
  });

  app.addContentTypeParser('application/json', (_req, body, done) => {
    done(null, body);
  });

  const FastifyNext = (await import('fastify-nextjs')).default;

  const NextJSDir = resolve(...dir);

  const prevWarn = console.warn;
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation((...message) => {
    if (!message[0]) return;

    if (
      message.some(str => {
        if (typeof str === 'string') {
          return (
            str.includes('Experimental features are not covered by semver') ||
            str.includes('You have enabled experimental feature(s)')
          );
        }

        return false;
      })
    ) {
      return;
    }

    prevWarn(...message);
  });

  TearDownPromises.push(LazyPromise(() => warnSpy.mockRestore()));

  await app.register(FastifyNext, {
    dir: NextJSDir,
    dev: false,
    logLevel: 'warn',
  });

  app.after(err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    if (!app.next) {
      console.error(Error(`Next.js could not be registered successfully`));
      process.exit(1);
    }

    app.next('*', { method: 'POST', schema: {} });
    app.next('*', { method: 'GET', schema: {} });
  });

  await app.ready();

  const port = await getPort();

  await new Promise((resolve, reject) => {
    app.listen(port).then(resolve, reject);

    autoClose && TearDownPromises.push(new PLazy<void>(resolve => app.close(resolve)));
  });

  const pool = getRequestPool(port, '/api/graphql');

  return { ...pool, app, NextJSDir };
}

export * from './dirname';
