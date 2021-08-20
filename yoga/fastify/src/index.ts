import type { Server as httpsServer } from 'https';
import type { Server as HttpServer } from 'http';

import Fastify, { FastifyServerOptions, FastifyHttpsOptions, FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { LazyPromise, gql } from 'graphql-ez';

import { BuildAppOptions, CreateApp, EZAppBuilder, EZApp, FastifyAppOptions } from '@graphql-ez/fastify';
import { BaseYogaConfig, getYogaPreset } from '@graphql-yoga/preset';

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

  serverOptions?:
    | FastifyServerOptions<HttpServer, FastifyLoggerInstance>
    | FastifyHttpsOptions<httpsServer, FastifyLoggerInstance>;
}

export { gql };

export interface StartOptions {
  /**
   * @default process.env.PORT || 8080
   */
  port?: number | string;
  /**
   * @default 0.0.0.0
   */
  host?: string;
  /**
   * Parameter to specify the maximum length of the queue of pending connections
   *
   * @default 511
   */
  backlog?: number;
}

export interface YogaApp {
  server: FastifyInstance;
  ezApp: EZAppBuilder;
  builtApp: Promise<EZApp>;
  start(options?: StartOptions): Promise<string>;
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

    return server.listen({ port: typeof port === 'string' ? parseInt(port) : port, host, ...rest });
  }

  return {
    ezApp,
    server,
    builtApp,
    start,
  };
}

export * from 'graphql-ez';
