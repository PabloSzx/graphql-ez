import { makeSchema, queryType } from 'nexus';
import { resolve } from 'path';

const Query = queryType({
  definition(t) {
    t.string('hello', {
      resolve() {
        return 'Hello World';
      },
    });
  },
});

export const schema = makeSchema({
  types: [Query],
  outputs: {
    schema: resolve('./schema.gql'),
    typegen: resolve('src/nexus-types.ts'),
  },
  prettierConfig: resolve('../../../.prettierrc'),
});
