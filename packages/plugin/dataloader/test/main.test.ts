import { resolve } from 'path';

import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { CommonSchema, createDeferredPromise, gql, startFastifyServer } from 'graphql-ez-testing';
import SchemaBuilder from '@pothos/core';
import { ezDataLoader, InferDataLoader, RegisteredDataLoader } from '../src';
import { ezWebSockets } from '../../websockets/src/index';
import DataLoader from 'dataloader';

type NumberMultiplier = RegisteredDataLoader<'NumberMultiplier', number, number>;

// This way just to not conflict with the packages types
export interface EZContext extends InferDataLoader<NumberMultiplier> {}
export interface EZResolvers {}

test('works', async () => {
  const targetPath = resolve(__dirname, 'ez.generated.ts');
  const codegenDone = createDeferredPromise();

  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezDataLoader(),
          ezCodegen({
            enableCodegen: true,
            config: {
              targetPath,
              onFinish: codegenDone.resolve,
              onError: codegenDone.reject,
              transformGenerated(code) {
                return code
                  .replace("import type { EZContext } from 'graphql-ez'", "import type { EZContext } from './main.test'")
                  .replace("declare module 'graphql-ez'", "declare module './main.test'")
                  .replace(
                    "extends Resolvers<import('graphql-ez').EZContext>",
                    "extends Resolvers<import('./main.test').EZContext>"
                  );
              },
            },
          }),
        ],
      },
      schema: {
        typeDefs: [
          CommonSchema.typeDefs,
          gql`
            extend type User {
              idMulti: Int!
            }
          `,
        ],
        resolvers: [
          CommonSchema.resolvers,
          {
            User: {
              idMulti(root, _args, ctx) {
                return ctx.NumberMultiplier.load(root.id);
              },
            },
          } as EZResolvers,
        ],
      },
    },
    buildOptions: {
      prepare(appBuilder) {
        appBuilder.registerDataLoader(
          'NumberMultiplier',
          DataLoader =>
            new DataLoader(async keys => {
              return keys.map(n => (n + 1) * 2);
            })
        ) as NumberMultiplier;
      },
    },
  });

  expect(await query('{users{id idMulti}}')).toMatchInlineSnapshot(`
    {
      "data": {
        "users": [
          {
            "id": 0,
            "idMulti": 2,
          },
          {
            "id": 1,
            "idMulti": 4,
          },
          {
            "id": 2,
            "idMulti": 6,
          },
        ],
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "83",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=5",
        },
        "statusCode": 200,
      },
    }
  `);

  await codegenDone.promise;
});

test('dataloaders are cleared for subscriptions', async () => {
  const builder = new SchemaBuilder<{
    Context: {
      clearedSubscription: DataLoader<number, string>;
      notClearedSubscription: DataLoader<number, string>;
    };
  }>({});
  builder.queryType({
    fields(t) {
      return {
        hello: t.string({
          resolve() {
            return 'Hello';
          },
        }),
      };
    },
  });
  builder.subscriptionType({});
  builder.subscriptionField('cleared', t =>
    t.field({
      type: 'String',
      async *subscribe() {
        yield 1;
        yield 2;
        yield 3;

        yield 1;
        yield 2;
        yield 3;
      },
      resolve(data, _args, { clearedSubscription }) {
        return clearedSubscription.load(data);
      },
    })
  );
  builder.subscriptionField('notCleared', t =>
    t.field({
      type: 'String',
      async *subscribe() {
        yield 1;
        yield 2;
        yield 3;

        yield 1;
        yield 2;
        yield 3;
      },
      resolve(data, _args, { notClearedSubscription }) {
        return notClearedSubscription.load(data);
      },
    })
  );

  let clearedDataLoaderCalls = 0;
  let notClearedDataLoaderCalls = 0;
  const { GraphQLWSWebsocketsClient } = await startFastifyServer({
    createOptions: {
      schema: builder.toSchema({}),
      ez: {
        plugins: [ezDataLoader(), ezWebSockets('new')],
      },
      prepare({ registerDataLoader }) {
        registerDataLoader(
          'clearedSubscription',
          DataLoader => new DataLoader(async (keys: readonly number[]) => keys.map(key => key + ' ' + ++clearedDataLoaderCalls))
        );
      },
      buildContext() {
        return {
          notClearedSubscription: new DataLoader(async (keys: readonly number[]) =>
            keys.map(key => key + ' ' + ++notClearedDataLoaderCalls)
          ),
        };
      },
    },
  });

  const clearedValues = await (async () => {
    const values: string[] = [];

    await GraphQLWSWebsocketsClient.subscribe<{ data: { cleared: string } }>('subscription{cleared}', ({ data }) => {
      values.push(data.cleared);
    }).done;

    return values;
  })();

  // Second dataloader calls with the same arguments don't have existing cache values
  expect(clearedValues).toStrictEqual(['1 1', '2 2', '3 3', '1 4', '2 5', '3 6']);

  const notClearedValues = await (async () => {
    const values: string[] = [];

    await GraphQLWSWebsocketsClient.subscribe<{ data: { notCleared: string } }>('subscription{notCleared}', ({ data }) => {
      values.push(data.notCleared);
    }).done;

    return values;
  })();

  // Second dataloader calls with the same arguments re-use cache values (not wanted)
  expect(notClearedValues).toStrictEqual(['1 1', '2 2', '3 3', '1 1', '2 2', '3 3']);
});
