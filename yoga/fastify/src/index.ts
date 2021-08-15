import Fastify, { FastifyServerOptions, FastifyInstance } from 'fastify';
import { LazyPromise, gql } from 'graphql-ez';

import { BuildAppOptions, CreateApp, EZAppBuilder, EZApp } from '@graphql-ez/fastify';
import { BaseYogaConfig, getYogaPreset } from '@graphql-yoga/preset';

export interface YogaConfig extends BaseYogaConfig {
  buildAppOptions?: BuildAppOptions;

  serverOptions?: FastifyServerOptions;
}

export { gql };

export class GraphQLServer {
  ezApp: EZAppBuilder;
  server: FastifyInstance;

  builtApp: Promise<EZApp>;

  constructor(config: YogaConfig = {}) {
    const preset = getYogaPreset(config);

    this.ezApp = CreateApp({
      ez: {
        preset,
      },
    });

    this.server = Fastify(config.serverOptions);

    this.builtApp = LazyPromise(() => {
      return this.ezApp.buildApp(config.buildAppOptions);
    });
  }

  public async start() {
    const { fastifyPlugin } = await this.builtApp;

    await this.server.register(fastifyPlugin);

    await this.server.ready();

    return this.server.listen(8080);
  }
}
