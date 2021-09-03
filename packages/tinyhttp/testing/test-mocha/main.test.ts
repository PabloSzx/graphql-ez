import { CommonSchema } from 'graphql-ez-testing';

import { CreateApp } from '@graphql-ez/tinyhttp';

import { CreateTestClient, GlobalTeardown } from '../src';

import { deepStrictEqual } from 'assert';

after(GlobalTeardown);

it('from preset', async () => {
  const ezAppBuilder = CreateApp({
    schema: CommonSchema.schema,
  });

  const { cleanup, query } = await CreateTestClient(ezAppBuilder);

  try {
    deepStrictEqual(await query('{hello}'), {
      data: {
        hello: 'Hello World!',
      },
    });
  } finally {
    await cleanup();
  }
});

it('from config', async () => {
  const { query } = await CreateTestClient({
    schema: CommonSchema.schema,
  });

  deepStrictEqual(await query('{hello}'), {
    data: {
      hello: 'Hello World!',
    },
  });
});

it('detect invalid app', async () => {
  deepStrictEqual(
    await CreateTestClient({
      asPreset: undefined,
    } as any).catch(err => ({ err: err.message || err })),
    { err: 'Invalid EZ App' }
  );
});
