import { execaCommand } from 'execa';
import getPort from 'get-port';
import { resolve } from 'path';
import waitOn from 'wait-on';

test('works', async () => {
  const { EZClient } = await import('../../../client/main/src/index');

  const port = await getPort();

  const miniflare = execaCommand(
    `node ${require.resolve('../node_modules/wrangler/bin/wrangler.js')} dev ${resolve(__dirname, './worker/worker.ts')} --port ${port}`,
    {
      stdio: 'ignore',
    }
  );

  const client = EZClient({
    endpoint: 'http://localhost:' + port + '/graphql',
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
