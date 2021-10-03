import { EZClient } from '@graphql-ez/client';
import { build } from 'esbuild';
import { command } from 'execa';
import { unlinkSync } from 'fs';
import getPort from 'get-port';
import { getDirname } from 'graphql-ez-testing';
import { createRequire } from 'module';
import { resolve } from 'path';
import waitOn from 'wait-on';

const __dirname = getDirname(import.meta.url);

const outfile = resolve(__dirname, './worker/bundle.js');

const require = createRequire(import.meta.url);

afterAll(() => {
  try {
    unlinkSync(outfile);
  } catch (err) {
    console.error(err);
  }
});

test('works', async () => {
  await build({
    entryPoints: [resolve(__dirname, './worker/worker.ts')],
    bundle: true,
    target: 'es2019',
    outfile,
    splitting: false,
    minify: true,
  });

  const port = await getPort();

  const miniflare = command(`${require.resolve('miniflare/dist/bootstrap.js')} ${outfile} -p ${port}`, {
    stdio: 'ignore',
  });

  const client = EZClient({
    endpoint: 'http://127.0.0.1:' + port + '/graphql',
  });
  try {
    await waitOn({
      resources: ['tcp:' + port],
      timeout: 5000,
    });

    await expect(client.query('{hello}')).resolves.toMatchInlineSnapshot(`
            Object {
              "data": Object {
                "hello": "Hello World!",
              },
            }
          `);
  } finally {
    miniflare.kill();

    client.client.close();
  }
});
