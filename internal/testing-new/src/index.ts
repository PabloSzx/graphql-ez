import getPort from 'get-port';
import { resolve } from 'path';

import { LazyPromise, PLazy } from '@graphql-ez/core-utils/promise';

import { TearDownPromises } from './common';
import { getRequestPool } from './request';
import {
  createGraphQLWSWebsocketsClient,
  createSubscriptionsTransportWebsocketsClient,
  GraphQLWSClientOptions,
  SubscriptionsTransportClientOptions,
} from './ws';

import type { BuildAppOptions, AppOptions } from '@graphql-ez/core-types';

export * from './upload';
export * from './schema';

export interface StartTestServerOptions<CreateOptions extends AppOptions, BuildOptions extends BuildAppOptions> {
  createOptions?: CreateOptions;
  buildOptions?: Partial<BuildOptions>;

  graphqlWsClientOptions?: Partial<GraphQLWSClientOptions>;
  /**
   * @default "/graphql"
   */
  websocketPath?: string;
  subscriptionsTransportClientOptions?: Partial<SubscriptionsTransportClientOptions>;
}

export const startFastifyServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  websocketPath,
}: StartTestServerOptions<
  import('@graphql-ez/fastify-new').FastifyAppOptions,
  import('@graphql-ez/fastify-new').BuildAppOptions
>) => {
  const server = (await import('fastify')).default();

  const { CreateApp } = await import('@graphql-ez/fastify-new');

  const appBuilder = CreateApp(createOptions);

  const ezApp = appBuilder.buildApp(buildOptions);

  await server.register(ezApp.fastifyPlugin);

  await server.ready();

  const port = await getPort();

  await new Promise<unknown>((resolve, reject) => {
    server.listen(port).then(resolve, reject);

    TearDownPromises.push(new PLazy<void>(resolve => server.close(resolve)));
  });

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, websocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      websocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export const startExpressServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  websocketPath,
}: StartTestServerOptions<
  import('@graphql-ez/express-new').ExpressAppOptions,
  import('@graphql-ez/express-new').ExpressBuildAppOptions
>) => {
  const server = (await import('express')).default();

  const { CreateApp } = await import('@graphql-ez/express-new');

  const appBuilder = CreateApp(createOptions);

  const ezApp = await appBuilder.buildApp({ ...buildOptions, app: server });

  server.use(ezApp.router);

  const port = await getPort();

  await new Promise<void>(resolve => {
    const httpServer = server.listen(port, () => {
      resolve();
    });

    TearDownPromises.push(new PLazy<unknown>(resolve => httpServer.close(resolve)));
  });

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, websocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      websocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export async function startHTTPServer({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  websocketPath,
}: StartTestServerOptions<import('@graphql-ez/http-new').HttpAppOptions, import('@graphql-ez/http-new').HTTPBuildAppOptions>) {
  const { CreateApp } = await import('@graphql-ez/http-new');

  const appBuilder = CreateApp(createOptions);

  const server = (await import('http')).createServer((req, res) => {
    ezApp.requestHandler(req, res);
  });

  const ezApp = appBuilder.buildApp({ ...buildOptions, server });

  const port = await getPort();

  await new Promise<void>(resolve => {
    server.listen(port, () => {
      resolve();
    });

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
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, websocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      websocketPath,
      subscriptionsTransportClientOptions
    ),
  };
}

export const startHapiServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  websocketPath,
}: StartTestServerOptions<import('@graphql-ez/hapi-new').HapiAppOptions, import('@graphql-ez/hapi-new').BuildAppOptions>) => {
  const port = await getPort();

  const server = (await import('@hapi/hapi')).server({
    port,
    host: 'localhost',
  });

  const { CreateApp } = await import('@graphql-ez/hapi-new');

  const appBuilder = CreateApp(createOptions);

  const ezApp = await appBuilder.buildApp(buildOptions);

  await server.register(ezApp.hapiPlugin);

  await server.start();

  TearDownPromises.push(
    LazyPromise(async () => {
      await server.stop();
    })
  );

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, websocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      websocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export const startKoaServer = async ({
  createOptions,
  buildOptions,
  graphqlWsClientOptions,
  subscriptionsTransportClientOptions,
  websocketPath,
}: StartTestServerOptions<import('@graphql-ez/koa-new').KoaAppOptions, import('@graphql-ez/koa-new').KoaBuildAppOptions>) => {
  const Koa = (await import('koa')).default;
  const KoaRouter = (await import('@koa/router')).default;

  const server = new Koa();

  const router = new KoaRouter();

  const { CreateApp } = await import('@graphql-ez/koa-new');

  const appBuilder = CreateApp(createOptions);

  const ezApp = await appBuilder.buildApp({ ...buildOptions, app: server, router });

  server.use(router.routes()).use(router.allowedMethods());

  const port = await getPort();

  await new Promise<void>(resolve => {
    const httpServer = server.listen(port, resolve);

    TearDownPromises.push(new PLazy(resolve => httpServer.close(resolve)));
  });

  const pool = getRequestPool(port);

  return {
    appBuilder,
    ezApp,
    ...pool,
    GraphQLWSWebsocketsClient: createGraphQLWSWebsocketsClient(pool.address, websocketPath, graphqlWsClientOptions),
    SubscriptionsTransportWebsocketsClient: createSubscriptionsTransportWebsocketsClient(
      pool.address,
      websocketPath,
      subscriptionsTransportClientOptions
    ),
  };
};

export async function startNextJSServer(dir: string) {
  const app = (await import('fastify')).default({
    pluginTimeout: 20000,
  });

  app.addContentTypeParser('application/json', (_req, body, done) => {
    done(null, body);
  });

  const FastifyNext = (await import('fastify-nextjs')).default;

  const NextJSDir = resolve(process.cwd(), dir);

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

    TearDownPromises.push(new PLazy<void>(resolve => app.close(resolve)));
  });

  const pool = getRequestPool(port, '/api/graphql');

  return { ...pool, NextJSDir };
}

export type {} from 'graphql';
export type {} from '@graphql-typed-document-node/core';
export type {} from 'undici/types/dispatcher';

export * from '@graphql-ez/core-utils';
