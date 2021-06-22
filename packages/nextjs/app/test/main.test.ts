import { LazyPromise } from '@graphql-ez/core';

import { HelloDocument } from './generated/envelop.generated';
import { startNextJSServer } from '@graphql-ez/testing/utils';

const startServer = LazyPromise(() => {
  return startNextJSServer();
});

beforeAll(async () => {
  await startServer;
}, 20000);

test('works', async () => {
  const { query } = await startServer;

  const result = await query(HelloDocument);

  expect(result.errors).not.toBeDefined();

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "hello": "Hello World!",
      },
    }
  `);
});
