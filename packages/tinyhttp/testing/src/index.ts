import { EZClient, EZClientOptions } from '@graphql-ez/client';
import type { BuildAppOptions, EZAppBuilder, tinyhttpAppOptions } from '@graphql-ez/tinyhttp';
import { CreateApp, EZContext, GetEnvelopedFn, LazyPromise, PromiseOrValue } from '@graphql-ez/tinyhttp';
import { App } from '@tinyhttp/app';
import assert from 'assert';
import getPort from 'get-port';
import { printSchema } from 'graphql';
import type { Server } from 'http';

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export async function CreateTestClient(
  ezApp: PromiseOrValue<EZAppBuilder | tinyhttpAppOptions>,
  options: {
    app?: App;
    serverOptions?: tinyhttpAppOptions;
    buildOptions?: BuildAppOptions;
    clientOptions?: Omit<EZClientOptions, 'endpoint'>;
    preListen?: (app: App) => void | Promise<void>;
  } = {}
): Promise<
  ReturnType<typeof EZClient> & {
    app: App;
    server: Server;
    endpoint: string;
    cleanup: () => Promise<void>;
    getEnveloped: GetEnvelopedFn<EZContext>;
    schemaString: string;
  }
> {
  const app = options.app || new App();

  let ezAppPath: string;

  ezApp = await ezApp;

  let getEnvelopedValue: GetEnvelopedFn<EZContext>;

  if ('asPreset' in ezApp && ezApp.asPreset) {
    const { buildApp, path } = CreateApp({
      ez: {
        preset: ezApp.asPreset,
      },
    });

    ezAppPath = path;

    const { getEnveloped } = await buildApp({ ...options.buildOptions, app });

    getEnvelopedValue = getEnveloped;
  } else if (!('buildApp' in ezApp) && !('asPreset' in ezApp)) {
    const { buildApp, path } = CreateApp(ezApp);

    ezAppPath = path;

    const { getEnveloped } = await buildApp({ ...options.buildOptions, app });

    getEnvelopedValue = getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  await options.preListen?.(app);

  const port = await getPort();

  const server = app.listen(port);

  const closeServer = LazyPromise<void>(() => new Promise(resolve => server.close(() => resolve())));

  teardownLazyPromiseList.push(closeServer);

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
    await Promise.allSettled([client.client.close(), closeServer]);
  };

  return {
    ...client,
    app,
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
