import { EZClient } from '@graphql-ez/client';
import { build } from 'esbuild';
import { command } from 'execa';
import { unlinkSync } from 'fs';
import getPort from 'get-port';
import { resolve } from 'path';
import waitOn from 'wait-on';

const outfile = resolve(__dirname, './worker/bundle.js');

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
            {
              "data": {
                "hello": "Hello World!",
              },
            }
          `);
  } finally {
    miniflare.kill();

    client.client.close();
  }
});
