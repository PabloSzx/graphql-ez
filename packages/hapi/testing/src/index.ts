import assert from 'assert';
import Hapi from '@hapi/hapi';
import getPort from 'get-port';
import { printSchema } from 'graphql';

import { EZClient, EZClientOptions } from '@graphql-ez/client';
import { CreateApp, EZContext, GetEnvelopedFn, LazyPromise, PromiseOrValue } from '@graphql-ez/hapi';

import type { BuildAppOptions, EZApp, EZAppBuilder, HapiAppOptions } from '@graphql-ez/hapi';

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export async function CreateTestClient(
  app: PromiseOrValue<EZAppBuilder | EZApp | HapiAppOptions>,
  options: {
    serverOptions?: Omit<Hapi.ServerOptions, 'port'>;
    buildOptions?: BuildAppOptions;
    clientOptions?: Omit<EZClientOptions, 'endpoint'>;
    preListen?: (server: Hapi.Server) => void | Promise<void>;
  } = {}
): Promise<
  ReturnType<typeof EZClient> & {
    server: Hapi.Server;
    endpoint: string;
    cleanup: () => Promise<void>;
    getEnveloped: GetEnvelopedFn<EZContext>;
    schemaString: string;
  }
> {
  const port = await getPort();

  const server = new Hapi.Server({ ...options.serverOptions, port });

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

    const { getEnveloped, hapiPlugin } = await buildApp(options.buildOptions);

    await server.register(hapiPlugin);

    getEnvelopedValue = getEnveloped;
  } else if ('hapiPlugin' in app && app.hapiPlugin) {
    ezAppPath = app.path;

    await server.register(app.hapiPlugin);

    getEnvelopedValue = app.getEnveloped;

    if (options.buildOptions) {
      console.warn(`"buildOptions" can't be applied for already built EZ Applications`);
    }
  } else if (!('buildApp' in app) && !('asPreset' in app)) {
    const { buildApp, path } = CreateApp(app);

    ezAppPath = path;

    const { hapiPlugin, getEnveloped } = await buildApp(options.buildOptions);

    await server.register(hapiPlugin);

    getEnvelopedValue = getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  await options.preListen?.(server);

  await server.start();

  teardownLazyPromiseList.push(
    LazyPromise(async () => {
      await server.stop();
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
    await Promise.allSettled([client.client.close(), server.stop()]);
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
