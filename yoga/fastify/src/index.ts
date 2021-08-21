import Fastify, { FastifyHttpsOptions, FastifyInstance, FastifyLoggerInstance, FastifyServerOptions } from 'fastify';
import { gql, LazyPromise } from 'graphql-ez';

import { BuildAppOptions, CreateApp, EZApp, EZAppBuilder, FastifyAppOptions, PickRequired } from '@graphql-ez/fastify';
import { BaseYogaConfig, getYogaPreset } from '@graphql-yoga/preset';

import type { ListenOptions } from 'net';
import type { Server as httpsServer } from 'https';
import type { Server as HttpServer } from 'http';

export interface YogaConfig
  extends BaseYogaConfig,
    Pick<
      FastifyAppOptions,
      | 'path'
      | 'cors'
      | 'routeOptions'
      | 'processRequestOptions'
      | 'allowBatchedQueries'
      | 'buildContext'
      | 'cache'
      | 'customHandleRequest'
      | 'envelop'
      | 'introspection'
      | 'onAppRegister'
      | 'prepare'
    > {
  buildAppOptions?: BuildAppOptions;

  /**
   * Fastify Server options
   */
  serverOptions?:
    | FastifyServerOptions<HttpServer, FastifyLoggerInstance>
    | FastifyHttpsOptions<httpsServer, FastifyLoggerInstance>;
}

export { gql };

export interface StartOptions extends Omit<ListenOptions, 'port'> {
  /**
   * @default process.env.PORT || 8080
   */
  port?: number | string;
  /**
   * @default 0.0.0.0
   */
  host?: string;
}

export interface YogaApp {
  server: FastifyInstance;
  ezApp: EZAppBuilder;
  builtApp: Promise<EZApp>;
  start(options?: StartOptions): Promise<{
    server: FastifyInstance;
    listenOptions: PickRequired<ListenOptions, 'host' | 'port'>;
  }>;
  gql: typeof gql;
}

export function GraphQLServer(config: YogaConfig = {}): YogaApp {
  const {
    buildAppOptions,
    serverOptions,
    path,
    cors,
    routeOptions,
    processRequestOptions,
    allowBatchedQueries,
    buildContext,
    cache,
    customHandleRequest,
    envelop,
    introspection,
    onAppRegister,
    prepare,
    schema,
    ...presetOptions
  } = config;

  const preset = getYogaPreset({ schema: typeof schema === 'object' ? schema : undefined, ...presetOptions });

  const ezApp = CreateApp({
    ez: {
      preset,
    },
    path,
    cors,
    routeOptions,
    processRequestOptions,
    allowBatchedQueries,
    buildContext,
    cache,
    customHandleRequest,
    envelop,
    introspection,
    onAppRegister,
    prepare,
  });

  const server = Fastify(serverOptions);

  const builtApp = LazyPromise(() => {
    return ezApp.buildApp(buildAppOptions);
  });

  async function start({ port = process.env.PORT || 8080, host = '0.0.0.0', ...rest }: StartOptions = {}) {
    const { fastifyPlugin } = await builtApp;

    await server.register(fastifyPlugin);

    await server.ready();

    const listenOptions = { port: typeof port === 'string' ? parseInt(port) : port, host, ...rest };

    await server.listen(listenOptions);

    return {
      server,
      listenOptions,
    };
  }

  return {
    ezApp,
    server,
    builtApp,
    start,
    gql,
  };
}

export * from 'graphql-ez';
