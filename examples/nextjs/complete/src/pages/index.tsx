import { request } from 'graphql-request';
import { useQuery } from '@tanstack/react-query';

import { HelloDocument, HelloQuery } from '../ez.generated';

export default function Index() {
  const { data, isLoading } = useQuery({
    queryKey: ['hello'],
    async queryFn() {
      const { hello } = await request<HelloQuery>('/api/graphql', HelloDocument);

      return hello;
    },
  });

  if (isLoading) return <p>Loading...</p>;
  return <p>{data}</p>;
}
