import { unlinkSync } from 'fs';
import { Miniflare } from 'miniflare';
import { build } from 'esbuild';
import { resolve } from 'path';

const outfile = resolve(__dirname, './worker/bundle.js');

beforeAll(async () => {
  await build({
    entryPoints: [resolve(__dirname, './worker/worker.ts')],
    bundle: true,
    target: 'es2019',
    outfile,
    splitting: false,
    minify: true,
    banner: {
      js: '// @ts-nocheck',
    },
  });
});

afterAll(() => {
  try {
    unlinkSync(outfile);
  } catch (err) {
    console.error(err);
  }
});

test('works', async () => {
  const { EZClient } = await import('../../../client/main/src/index');

  const miniflare = new Miniflare({
    script: outfile,
  });

  const ready = await miniflare.ready;

  const port = ready.port;

  const client = EZClient({
    endpoint: 'http://localhost:' + port + '/graphql',
  });
  try {
    await expect(client.query('{hello}')).resolves.toMatchInlineSnapshot(`
            {
              "data": {
                "hello": "Hello World!",
              },
            }
          `);
  } finally {
    await miniflare.dispose();

    await client.client.close();
  }
});
