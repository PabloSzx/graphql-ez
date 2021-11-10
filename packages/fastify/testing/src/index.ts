import assert from 'assert';
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { printSchema } from 'graphql';

import { EZClient, EZClientOptions } from '@graphql-ez/client';
import { CreateApp, EZContext, GetEnvelopedFn, LazyPromise, PromiseOrValue } from '@graphql-ez/fastify';

import type { BuildAppOptions, EZApp, EZAppBuilder, FastifyAppOptions } from '@graphql-ez/fastify';

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export async function CreateTestClient(
  app: PromiseOrValue<EZAppBuilder | EZApp | FastifyAppOptions>,
  options: {
    serverOptions?: FastifyServerOptions;
    buildOptions?: BuildAppOptions;
    clientOptions?: Omit<EZClientOptions, 'endpoint'>;
    preListen?: (server: FastifyInstance) => void | Promise<void>;
  } = {}
): Promise<
  ReturnType<typeof EZClient> & {
    server: FastifyInstance;
    endpoint: string;
    cleanup: () => Promise<void>;
    getEnveloped: GetEnvelopedFn<EZContext>;
    schemaString: string;
  }
> {
  const server = Fastify(options.serverOptions);

  let ezAppPath: string;

  app = await app;

  let getEnvelopedValue: GetEnvelopedFn<EZContext>;

  if ('asPreset' in app && app.asPreset) {
    const { buildApp, path } = CreateApp({
      ez: {
        preset: app.asPreset,
      },
    });

    ezAppPath = path;

    const { fastifyPlugin, getEnveloped } = buildApp(options.buildOptions);

    await server.register(fastifyPlugin);

    getEnvelopedValue = await getEnveloped;
  } else if ('fastifyPlugin' in app && app.fastifyPlugin) {
    ezAppPath = app.path;

    await server.register(app.fastifyPlugin);

    getEnvelopedValue = await app.getEnveloped;

    if (options.buildOptions) {
      console.warn(`"buildOptions" can't be applied for already built EZ Applications`);
    }
  } else if (!('buildApp' in app) && !('asPreset' in app)) {
    const { buildApp, path } = CreateApp(app);

    ezAppPath = path;

    const { fastifyPlugin, getEnveloped } = buildApp(options.buildOptions);

    await server.register(fastifyPlugin);

    getEnvelopedValue = await getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  await options.preListen?.(server);

  const port = await server.listen(0).then(() => {
    try {
      const addressInfo = server.server.address();

      if (addressInfo == null || typeof addressInfo !== 'object') {
        throw Error('Invalid Server');
      }

      return addressInfo.port;
    } catch (err) {
      throw err;
    }
  });

  teardownLazyPromiseList.push(
    LazyPromise(async () => {
      await server.close();
    })
  );

  assert(ezAppPath, 'Path for EZ App could not be found!');

  const endpoint = `http://127.0.0.1:${port}${ezAppPath}`;

  const client = EZClient({
    endpoint,
    ...options.clientOptions,
  });

  teardownLazyPromiseList.push(
    LazyPromise(async () => {
      await client.client.close();
    })
  );

  const cleanup = async () => {
    await Promise.allSettled([client.client.close(), server.close()]);
  };

  return {
    ...client,
    server,
    endpoint,
    cleanup,
    getEnveloped: getEnvelopedValue,
    get schema() {
      return getEnvelopedValue().schema;
    },
    get schemaString() {
      return printSchema(getEnvelopedValue().schema);
    },
  };
}
