import { buildSchema, Query, Resolver } from 'type-graphql';

@Resolver()
export class QueryResolver {
  @Query()
  hello(): string {
    return 'Hello World!';
  }
}

export const schema = buildSchema({
  resolvers: [QueryResolver],
  emitSchemaFile: true,
});
