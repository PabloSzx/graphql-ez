import { CommonSchema, startFastifyServer } from 'graphql-ez-testing';

import { getIntrospectionQuery } from 'graphql';

test.concurrent('disabled introspection', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      introspection: {
        disable: true,
      },
    },
  });

  const result1 = await query(getIntrospectionQuery());

  expect(result1.errors).toBeTruthy();
  expect(result1.data).toBeFalsy();

  const { query: query2 } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      introspection: {
        disable: false,
      },
    },
  });

  const result2 = await query2(getIntrospectionQuery());

  expect(result2.errors).toBeFalsy();
  expect(result2.data).toBeTruthy();
});

test.concurrent('conditional disable introspection', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      introspection: {
        disable: {
          disableIf(args) {
            return args.context.req.headers.authorization !== 'SECRET';
          },
        },
      },
    },
  });

  expect(
    (
      await query(getIntrospectionQuery(), {
        headers: {
          authorization: 'SECRET',
        },
      })
    ).data
  ).toBeTruthy();

  expect((await query(getIntrospectionQuery())).errors).toBeTruthy();
});
