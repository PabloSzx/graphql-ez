import { resolve } from 'path';

import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { CommonSchema, createDeferredPromise, gql, startFastifyServer } from 'graphql-ez-testing';

import { ezDataLoader, InferDataLoader, RegisteredDataLoader } from '../src';

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
                  .replace("import type { EZContext } from '@graphql-ez/fastify'", "import type { EZContext } from './main.test'")
                  .replace("declare module '@graphql-ez/fastify'", "declare module './main.test'")
                  .replace(
                    "extends Resolvers<import('@graphql-ez/fastify').EZContext>",
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
Object {
  "data": Object {
    "users": Array [
      Object {
        "id": 0,
        "idMulti": 2,
      },
      Object {
        "id": 1,
        "idMulti": 4,
      },
      Object {
        "id": 2,
        "idMulti": 6,
      },
    ],
  },
}
`);

  await codegenDone.promise;
});
