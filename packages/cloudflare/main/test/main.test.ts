import { build } from 'esbuild';
import { command } from 'execa';
import getPort from 'get-port';
import nodeFetch from 'node-fetch';
import { resolve } from 'path';
import waitOn from 'wait-on';

test('works', async () => {
  const outfile = resolve(__dirname, './worker/bundle.js');
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

  try {
    await waitOn({
      resources: ['tcp:' + port],
      timeout: 5000,
    });

    const response = await nodeFetch(`http://127.0.0.1:${port}/graphql?query={hello}`);

    await expect(response.json()).resolves.toMatchInlineSnapshot(`
            Object {
              "data": Object {
                "hello": "Hello World!",
              },
            }
          `);
  } finally {
    miniflare.kill();
  }
});
