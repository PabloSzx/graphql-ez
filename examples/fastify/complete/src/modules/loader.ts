import type { InferDataLoader } from '@graphql-ez/plugin-dataloader';

import { registerModule, gql, registerDataLoader } from '../app';

const multiplierDataLoader = registerDataLoader(
  'Multiplier',
  DataLoader =>
    new DataLoader<number, number>(async numbers => {
      return numbers.map(v => v * 2);
    })
);

declare module '@graphql-ez/fastify' {
  interface EZContext extends InferDataLoader<typeof multiplierDataLoader> {}
}

registerModule(
  gql`
    extend type Query {
      multiply(n: Float!): Float!
    }
  `,
  {
    resolvers: {
      Query: {
        multiply(_root, { n }, { Multiplier }) {
          return Multiplier.load(n);
        },
      },
    },
  }
);
