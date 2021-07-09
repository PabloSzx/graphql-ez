import { Query, Resolver } from 'type-graphql';

@Resolver()
export class QueryResolver {
  @Query()
  hello(): string {
    return 'Hello World!';
  }
}
