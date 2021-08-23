import { CreateTestClient as CreateFastifyTestClient, GlobalTeardown } from '@graphql-ez/fastify-testing';
import { PingSubscription, sleep } from 'graphql-ez-testing';
import { ezSSE } from '../src';
afterAll(GlobalTeardown);

test('fastify', async () => {
  const { newSSESubscribe } = await CreateFastifyTestClient({ schema: PingSubscription.schema, ez: { plugins: [ezSSE()] } });

  const { iterator } = await newSSESubscribe.subscribe('subscription{ping}', {
    onData(data) {
      console.log(data);
    },
  });

  for await (const data of iterator) {
    expect(data).toMatchInlineSnapshot();

    break;
  }

  await sleep(5000);
});
