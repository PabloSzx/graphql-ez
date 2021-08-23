import { EZClient, EZClientOptions } from '@graphql-ez/client';
import type { BuildAppOptions, EZApp, EZAppBuilder, FastifyAppOptions } from '@graphql-ez/fastify';
import {
  CreateApp,
  EZContext,
  GetEnvelopedFn,
  InternalAppBuildContextKey,
  LazyPromise,
  PromiseOrValue,
} from '@graphql-ez/fastify';
import assert from 'assert';
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import getPort from 'get-port';
import { printSchema } from 'graphql';

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

  let newSSEEndpoint: string | undefined;

  if ('asPreset' in app && app.asPreset) {
    const ezAppBuilder = CreateApp({
      ez: {
        preset: app.asPreset,
      },
    });

    newSSEEndpoint = ezAppBuilder[InternalAppBuildContextKey].sse?.path;

    const { buildApp, path } = ezAppBuilder;

    ezAppPath = path;

    const builtApp = buildApp(options.buildOptions);

    const { fastifyPlugin, getEnveloped } = builtApp;
    await server.register(fastifyPlugin);

    getEnvelopedValue = await getEnveloped;
  } else if ('fastifyPlugin' in app && app.fastifyPlugin) {
    ezAppPath = app.path;

    await server.register(app.fastifyPlugin);

    newSSEEndpoint = app[InternalAppBuildContextKey].sse?.path;

    getEnvelopedValue = await app.getEnveloped;

    if (options.buildOptions) {
      console.warn(`"buildOptions" can't be applied for already built EZ Applications`);
    }
  } else if (!('buildApp' in app) && !('asPreset' in app)) {
    const ezApp = CreateApp(app);

    newSSEEndpoint = ezApp[InternalAppBuildContextKey].sse?.path;

    const { buildApp, path } = ezApp;

    ezAppPath = path;

    const { fastifyPlugin, getEnveloped } = buildApp(options.buildOptions);

    await server.register(fastifyPlugin);

    getEnvelopedValue = await getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  await options.preListen?.(server);

  const port = await getPort();

  await server.listen(port);

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
    newSSEEndpoint,
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
