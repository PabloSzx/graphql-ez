import { EZClient, EZClientOptions } from '@graphql-ez/client';
import type { BuildAppOptions, ExpressAppOptions, EZApp, EZAppBuilder } from '@graphql-ez/express';
import { CreateApp, EZContext, GetEnvelopedFn, LazyPromise, PromiseOrValue } from '@graphql-ez/express';
import assert from 'assert';
import Express, { Application } from 'express';
import { printSchema } from 'graphql';
import type { Server } from 'http';

const getPort = LazyPromise(() => {
  return import('get-port').then(v => v.default);
});

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export async function CreateTestClient(
  ezApp: PromiseOrValue<EZAppBuilder | EZApp | ExpressAppOptions>,
  options: {
    app?: Application;
    serverOptions?: ExpressAppOptions;
    buildOptions?: BuildAppOptions;
    clientOptions?: Omit<EZClientOptions, 'endpoint'>;
    preListen?: (app: Application) => void | Promise<void>;
  } = {}
): Promise<
  ReturnType<typeof EZClient> & {
    app: Application;
    server: Server;
    endpoint: string;
    cleanup: () => Promise<void>;
    getEnveloped: GetEnvelopedFn<EZContext>;
    schemaString: string;
  }
> {
  const app = options.app || Express();

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

    const { router, getEnveloped } = await buildApp({ ...options.buildOptions, app });

    app.use(router);

    getEnvelopedValue = getEnveloped;
  } else if ('router' in ezApp && ezApp.router) {
    assert(options.app, 'If you give an already built EZ Application, you have to specify the express "app" in the options.');

    ezAppPath = ezApp.path;

    app.use(ezApp.router);

    getEnvelopedValue = ezApp.getEnveloped;

    if (options.buildOptions) {
      console.warn(`"buildOptions" can't be applied for already built EZ Applications`);
    }
  } else if (!('buildApp' in ezApp) && !('asPreset' in ezApp)) {
    const { buildApp, path } = CreateApp(ezApp);

    ezAppPath = path;

    const { router, getEnveloped } = await buildApp({ ...options.buildOptions, app });

    app.use(router);

    getEnvelopedValue = getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  await options.preListen?.(app);

  const port = await (await getPort)();

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
