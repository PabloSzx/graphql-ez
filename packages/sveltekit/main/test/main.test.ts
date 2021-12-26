import { EZClient } from '@graphql-ez/client';
import { LazyPromise } from '@graphql-ez/utils';
import { command } from 'execa';
import getPort from 'get-port';
import { getStringFromStream } from 'graphql-ez-testing';
import { resolve } from 'path';
import waitOn from 'wait-on';

let port: number;

const TearDownPromises: Promise<unknown>[] = [];

const isNode12 = process.version.startsWith('v12');

beforeAll(async () => {
  if (isNode12) return;

  await command(`node ${require.resolve(resolve(__dirname, '../node_modules/@sveltejs/kit/svelte-kit.js'))} build`, {
    cwd: resolve(__dirname, './test-example/'),
    stdio: 'ignore',
  });

  const preview = command(
    `node ${require.resolve(resolve(__dirname, '../node_modules/@sveltejs/kit/svelte-kit.js'))} preview --port=${(port =
      await getPort())}`,
    {
      cwd: resolve(__dirname, './test-example/'),
      stdio: 'ignore',
    }
  );

  TearDownPromises.push(
    LazyPromise(() => {
      return preview.kill();
    }),
    LazyPromise(async () => {
      await preview;
    })
  );

  await waitOn({
    resources: ['tcp:' + port],
    timeout: 5000,
  });
});

afterAll(async () => {
  if (isNode12) return;

  await Promise.allSettled(TearDownPromises);
});

const testSkipNode12 = isNode12 ? test.skip : test;

testSkipNode12('basic schema', async () => {
  const { client, query } = EZClient({
    endpoint: `http://127.0.0.1:${port}/graphql`,
  });

  TearDownPromises.push(
    LazyPromise(() => {
      return client.close();
    })
  );

  await expect(query('{hello}')).resolves.toMatchInlineSnapshot(`
          {
            "data": {
              "hello": "Hello World!",
            },
          }
        `);

  await expect(
    query('{hello}', {
      method: 'GET',
    })
  ).resolves.toMatchInlineSnapshot(`
          {
            "data": {
              "hello": "Hello World!",
            },
          }
        `);

  await expect(query('{ctx}')).resolves.toMatchInlineSnapshot(`
          {
            "data": {
              "ctx": "{
            \\"foo\\": \\"bar\\"
          }",
            },
          }
        `);
});

testSkipNode12('altair', async () => {
  const { client } = EZClient({
    endpoint: `http://127.0.0.1:${port}/graphql`,
  });

  TearDownPromises.push(
    LazyPromise(() => {
      return client.close();
    })
  );

  expect(
    (
      await getStringFromStream(
        (
          await client.request({
            path: '/altair',
            method: 'GET',
          })
        ).body
      )
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "<!doctype html>
    <html>

    <head>
      <meta charset=\\"utf-8\\">
      <title>Altair</title>
      <base href=\\"/altair/\\">
      <meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\">
      <link rel=\\"icon\\" type=\\"image/x-icon\\" href=\\"favicon.ico\\">
      <link href=\\"styles.css\\" rel=\\"stylesheet\\" />
    </head>

    <body>
      <a"
  `);

  expect(
    (
      await getStringFromStream(
        (
          await client.request({
            path: '/altair/styles.css',
            method: 'GET',
          })
        ).body
      )
    ).slice(0, 300)
  ).toMatchInlineSnapshot(
    `"@charset \\"UTF-8\\";[class*=ant-]::-ms-clear,[class*=ant-] input::-ms-clear,[class*=ant-] input::-ms-reveal,[class^=ant-]::-ms-clear,[class^=ant-] input::-ms-clear,[class^=ant-] input::-ms-reveal{display:none}body,html{width:100%}input::-ms-clear,input::-ms-reveal{display:none}*,:after,:before{box-sizi"`
  );
});

testSkipNode12('graphiql', async () => {
  const { client } = EZClient({
    endpoint: `http://127.0.0.1:${port}/graphql`,
  });

  TearDownPromises.push(
    LazyPromise(() => {
      return client.close();
    })
  );

  expect(
    (
      await getStringFromStream(
        (
          await client.request({
            path: '/graphql',
            method: 'GET',
            headers: {
              accept: 'text/html',
            },
          })
        ).body
      )
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);
});

testSkipNode12('voyager', async () => {
  const { client } = EZClient({
    endpoint: `http://127.0.0.1:${port}/graphql`,
  });

  TearDownPromises.push(
    LazyPromise(() => {
      return client.close();
    })
  );

  expect(
    (
      await getStringFromStream(
        (
          await client.request({
            path: '/voyager',
            method: 'GET',
          })
        ).body
      )
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8 />
        <meta name=\\"viewport\\" content=\\"user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0\\">
        <title>GraphQL Voyager</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
         "
  `);
});
