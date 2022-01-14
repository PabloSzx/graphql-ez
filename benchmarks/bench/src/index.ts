import md5 from 'md5';

import { makeExecutableSchema } from '@graphql-tools/schema';

import { data } from './schema/data';

import type { GraphQLSchema } from 'graphql';

export const schema = makeExecutableSchema({
  typeDefs: `
  type Author {
    id: ID!
    name: String!
    md5: String!
    company: String!
    books: [Book!]!
  }

  type Book {
    id: ID!
    name: String!
    numPages: Int!
  }

  type Query {
    authors: [Author!]!
  }
`,
  resolvers: {
    Author: {
      md5: (parent: { id: string; name: string; company: string; books: { id: string; name: string; numPages: number }[] }) =>
        md5(parent.name),
    },
    Query: {
      authors: () => data,
    },
  },
}) as unknown as GraphQLSchema;
