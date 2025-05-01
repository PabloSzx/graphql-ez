import { EZClient, EZClientOptions } from '@graphql-ez/client';
import type { BuildAppOptions, EZAppBuilder } from '@graphql-ez/koa';
import { CreateApp, EZContext, GetEnvelopedFn, KoaAppOptions, LazyPromise, PromiseOrValue } from '@graphql-ez/koa';
import KoaRouter from '@koa/router';
import assert from 'assert';
import { printSchema } from 'graphql';
import type { Server as httpServer } from 'http';
import Koa from 'koa';

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export async function CreateTestClient(
  ezApp: PromiseOrValue<(EZAppBuilder | KoaAppOptions) & { getEnveloped?: never }>,
  options: {
    buildOptions?: BuildAppOptions;
    clientOptions?: Omit<EZClientOptions, 'endpoint'>;
    router?: KoaRouter;
    app?: Koa;
  } = {}
): Promise<
  ReturnType<typeof EZClient> & {
    app: Koa;
    router: KoaRouter;
    endpoint: string;
    cleanup: () => Promise<void>;
    getEnveloped: GetEnvelopedFn<EZContext>;
    schemaString: string;
    server: httpServer;
  }
> {
  const app = options.app || new Koa();

  const router = options.router || new KoaRouter();

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

    const { getEnveloped } = await buildApp({
      app,
      router,
      ...options.buildOptions,
    });

    getEnvelopedValue = getEnveloped;
  } else if (!('buildApp' in ezApp) && !('asPreset' in ezApp) && !('getEnveloped' in ezApp)) {
    const { buildApp, path } = CreateApp(ezApp);

    ezAppPath = path;

    const { getEnveloped } = await buildApp({
      app,
      router,
      ...options.buildOptions,
    });

    getEnvelopedValue = getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }
  app.use(router.routes()).use(router.allowedMethods());

  const [server, port] = await new Promise<[httpServer, number]>((resolve, reject) => {
    const server = app.listen(0, () => {
      try {
        const addressInfo = server.address();

        if (addressInfo == null || typeof addressInfo !== 'object') {
          return reject(Error('Invalid Server'));
        }

        resolve([server, addressInfo.port]);
      } catch (err) {
        reject(err);
      }
    });
  });

  teardownLazyPromiseList.push(
    LazyPromise(async () => {
      await new Promise<unknown>(resolve => {
        server.close(resolve);
      });
    })
  );

  assert(ezAppPath, 'Path for EZ App could not be found!');

  const endpoint = `http://localhost:${port}${ezAppPath}`;

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
    await Promise.allSettled([
      client.client.close(),
      new Promise<unknown>(resolve => {
        server.close(resolve);
      }),
    ]);
  };

  return {
    ...client,
    app,
    router,
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
