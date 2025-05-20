import { execa } from 'execa';
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

test.skip('works', async () => {
  const { EZClient } = await import('../../../client/main/src/index');

  const port = await getPort();

  const miniflare = execa(`${require.resolve('../node_modules/miniflare/bootstrap.js')} ${outfile} -p ${port}`, {
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

    await client.client.close();
  }
});
