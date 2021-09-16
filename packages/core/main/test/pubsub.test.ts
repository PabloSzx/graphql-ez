import { InMemoryPubSub } from '../src/pubsub';

describe('InMemoryPubSub', () => {
  test('works', async () => {
    expect.assertions(4);
    const pubSub = new InMemoryPubSub();

    const iterator = pubSub.subscribe<number>('hello');

    setTimeout(() => {
      pubSub.publish('hello', 1);

      pubSub.publish('hello', 2);

      pubSub.publish('hello', 3);

      pubSub.publish('hello', 4);

      pubSub.close();
    });

    let i = 0;
    for await (const data of iterator) {
      expect(data).toBe(++i);
    }
  });
});
