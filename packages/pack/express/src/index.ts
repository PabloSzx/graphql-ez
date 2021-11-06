import { BuildAppOptions, CreateApp, ExpressAppOptions, EZApp, EZAppBuilder, EZPlugin } from '@graphql-ez/express';
import { BasePackConfig, getYogaPreset } from '@graphql-ez/pack-preset';
import Express, { Application } from 'express';
import { gql, LazyPromise, PickRequired } from 'graphql-ez';
import type { Server as httpServer } from 'http';
import type { Server as httpsServer, ServerOptions as httpsServerOptions } from 'https';
import type { ListenOptions } from 'net';

export interface YogaConfig
  extends BasePackConfig,
    Pick<
      ExpressAppOptions,
      | 'path'
      | 'cors'
      | 'processRequestOptions'
      | 'allowBatchedQueries'
      | 'buildContext'
      | 'cache'
      | 'customHandleRequest'
      | 'envelop'
      | 'introspection'
      | 'onAppRegister'
      | 'prepare'
      | 'bodyParserJSONOptions'
    > {
  buildAppOptions?: BuildAppOptions;

  /**
   * Create HTTPS Server options
   */
  https?: httpsServerOptions;

  /**
   * Custom EZ Plugins
   */
  ezPlugins?: EZPlugin[];
}

export * from 'graphql-ez';
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
  expressApp: Application;
  ezApp: EZAppBuilder;
  builtApp: Promise<EZApp>;
  start(options?: StartOptions): Promise<{
    server: httpServer | httpsServer;
    listenOptions: PickRequired<ListenOptions, 'host' | 'port'>;
  }>;
}

export function GraphQLServer(config: YogaConfig = {}): YogaApp {
  const {
    buildAppOptions,
    path,
    cors,
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
    bodyParserJSONOptions,
    https,
    ezPlugins,
    ...presetOptions
  } = config;

  const preset = getYogaPreset({ schema: typeof schema === 'object' ? schema : undefined, ...presetOptions });

  const ezApp = CreateApp({
    ez: {
      preset,
      plugins: ezPlugins,
    },
    path,
    cors,
    processRequestOptions,
    allowBatchedQueries,
    buildContext,
    cache,
    customHandleRequest,
    envelop,
    introspection,
    onAppRegister,
    prepare,
    bodyParserJSONOptions,
  });

  const expressApp = Express();

  const serverPromise = LazyPromise<httpServer | httpsServer>(async () => {
    if (https) {
      const { createServer } = await import('https');

      return createServer(https, expressApp);
    }

    const { createServer } = await import('http');

    return createServer(expressApp);
  });

  const builtApp = LazyPromise(() => {
    return ezApp.buildApp({ app: expressApp, ...buildAppOptions });
  });

  async function start({ port = process.env.PORT || 8080, host = '0.0.0.0', ...rest }: StartOptions = {}) {
    const { router } = await builtApp;

    expressApp.use(router);

    const server = await serverPromise;

    const listenOptions = { port: typeof port === 'string' ? parseInt(port) : port, host, ...rest };

    return {
      server: server.listen(listenOptions),
      listenOptions,
    };
  }

  return {
    ezApp,
    expressApp,
    builtApp,
    start,
  };
}
