import { EZClient, EZClientOptions } from '@graphql-ez/client';
import type { AppOptions, BuildAppOptions, EZAppBuilder } from '@graphql-ez/http';
import { AsyncRequestHandler, CreateApp, EZContext, GetEnvelopedFn, LazyPromise, PromiseOrValue } from '@graphql-ez/http';
import assert from 'assert';
import { printSchema } from 'graphql';
import { createServer, Server } from 'http';
const getPort = LazyPromise(() => {
  return import('get-port').then(v => v.default);
});

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export async function CreateTestClient(
  ezApp: PromiseOrValue<(EZAppBuilder | AppOptions) & { getEnveloped?: never }>,
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
  const server = createServer((req, res) => {
    ezRequestHandler(req, res);
  });

  let ezAppPath: string;

  ezApp = await ezApp;

  let getEnvelopedValue: GetEnvelopedFn<EZContext>;

  let ezRequestHandler: AsyncRequestHandler;

  if ('asPreset' in ezApp && ezApp.asPreset) {
    const { buildApp, path } = CreateApp({
      ez: {
        preset: ezApp.asPreset,
      },
    });

    ezAppPath = path;

    const { getEnveloped, requestHandler, ready } = buildApp({ server, ...options.buildOptions });

    ezRequestHandler = requestHandler;

    await ready;

    getEnvelopedValue = await getEnveloped;
  } else if (!('buildApp' in ezApp) && !('asPreset' in ezApp) && !('requestHandler' in ezApp) && !('getEnveloped' in ezApp)) {
    const { buildApp, path } = CreateApp(ezApp);

    ezAppPath = path;

    const { requestHandler, getEnveloped, ready } = buildApp({ server, ...options.buildOptions });

    ezRequestHandler = requestHandler;

    await ready;

    getEnvelopedValue = await getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  const port = await (await getPort)();

  await new Promise<void>(resolve => {
    server.listen(port, '127.0.0.1', 441, () => {
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
