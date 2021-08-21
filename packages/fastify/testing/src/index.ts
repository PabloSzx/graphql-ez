import { EZClient, EZClientOptions } from '@graphql-ez/client';
import type { BuildAppOptions, EZApp, EZAppBuilder, FastifyAppOptions } from '@graphql-ez/fastify';
import { CreateApp, LazyPromise } from '@graphql-ez/fastify';
import assert from 'assert';
import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import getPort from 'get-port';

const teardownLazyPromiseList: Promise<void>[] = [];
export const GlobalTeardown = LazyPromise(async () => {
  await Promise.allSettled(teardownLazyPromiseList);
});

export async function CreateTestClient(
  app: EZAppBuilder | EZApp | FastifyAppOptions,
  options: {
    server?: FastifyServerOptions;
    buildOptions?: BuildAppOptions;
    clientOptions?: Omit<EZClientOptions, 'endpoint'>;
    preListen?: (server: FastifyInstance) => void | Promise<void>;
  } = {}
): Promise<ReturnType<typeof EZClient> & { server: FastifyInstance; endpoint: string; cleanup: () => Promise<void> }> {
  const server = Fastify(options.server);

  let ezAppPath: string;

  if ('asPreset' in app && app.asPreset) {
    const { buildApp, path } = CreateApp({
      ez: {
        preset: app.asPreset,
      },
    });

    ezAppPath = path;

    const { fastifyPlugin } = buildApp(options.buildOptions);

    await server.register(fastifyPlugin);
  } else if ('fastifyPlugin' in app && app.fastifyPlugin) {
    ezAppPath = app.path;

    await server.register(app.fastifyPlugin);

    if (options.buildOptions) {
      console.warn(`buildOptions: ${JSON.stringify(options.buildOptions)} could not be applied`);
    }
  } else if (!('buildApp' in app) && !('asPreset' in app)) {
    const { buildApp, path } = CreateApp(app);

    ezAppPath = path;

    const { fastifyPlugin } = buildApp(options.buildOptions);

    await server.register(fastifyPlugin);
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
  });

  teardownLazyPromiseList.push(
    LazyPromise(async () => {
      await client.client.close();
    })
  );

  const cleanup = async () => {
    await Promise.all([client.client.close(), server.close()]).catch(() => {});
  };

  return {
    ...client,
    server,
    endpoint,
    cleanup,
  };
}
