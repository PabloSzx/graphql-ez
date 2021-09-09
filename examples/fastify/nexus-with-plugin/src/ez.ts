import { CreateApp } from '@graphql-ez/fastify';
import { ezUnpkgAltairIDE } from '@graphql-ez/plugin-altair';
import { ezNexus } from '@graphql-ez/plugin-nexus';
import { resolve } from 'path';

export const { buildApp, registerNexus } = CreateApp({
  ez: {
    plugins: [
      ezUnpkgAltairIDE({}),
      ezNexus({
        outputs: {
          schema: resolve('./schema.gql'),
          typegen: resolve('src/nexus-types.ts'),
        },
        prettierConfig: resolve('../../../.prettierrc'),
      }),
    ],
  },
  async prepare() {
    await import('./schema');
  },
});
