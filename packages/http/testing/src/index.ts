import { EZClient, EZClientOptions } from '@graphql-ez/client';
import type { AppOptions, BuildAppOptions, EZAppBuilder } from '@graphql-ez/http';
import {
  AsyncRequestHandler,
  CreateApp,
  createDeferredPromise,
  EZContext,
  GetEnvelopedFn,
  LazyPromise,
  PromiseOrValue,
} from '@graphql-ez/http';
import assert from 'assert';
import getPort from 'get-port';
import { printSchema } from 'graphql';
import { createServer, Server } from 'http';

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export async function CreateTestClient(
  app: PromiseOrValue<(EZAppBuilder | AppOptions) & { requestHandler?: never }>,
  options: {
    buildOptions?: BuildAppOptions;
    clientOptions?: Omit<EZClientOptions, 'endpoint'>;
  } = {}
): Promise<
  ReturnType<typeof EZClient> & {
    server: Server;
    endpoint: string;
    cleanup: () => Promise<void>;
    getEnveloped: GetEnvelopedFn<EZContext>;
    schemaString: string;
  }
> {
  const ok = createDeferredPromise<void>();
  const server = createServer((req, res) => {
    ezRequestHandler(req, res);
  });

  let ezAppPath: string;

  app = await app;

  let getEnvelopedValue: GetEnvelopedFn<EZContext>;

  let ezRequestHandler: AsyncRequestHandler;

  if ('asPreset' in app && app.asPreset) {
    const { buildApp, path } = CreateApp({
      ez: {
        preset: app.asPreset,
      },
      onBuildPromiseError(err) {
        ok.reject(err);
      },
    });

    ezAppPath = path;

    const { getEnveloped, requestHandler } = buildApp({ server, ...options.buildOptions });

    ezRequestHandler = requestHandler;

    getEnvelopedValue = await getEnveloped;
  } else if (!('buildApp' in app) && !('asPreset' in app) && !('requestHandler' in app)) {
    const { buildApp, path } = CreateApp(app);

    ezAppPath = path;

    const { requestHandler, getEnveloped } = buildApp({ server, ...options.buildOptions });

    ezRequestHandler = requestHandler;

    getEnvelopedValue = await getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  const port = await getPort();

  await new Promise<void>(resolve => {
    server.listen(port, '127.0.0.1', 441, () => {
      ok.resolve();
      resolve();
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
    await Promise.allSettled([
      client.client.close(),
      new Promise<unknown>(resolve => {
        server.close(resolve);
      }),
    ]);
  };

  await ok.promise;

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
