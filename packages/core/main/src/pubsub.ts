interface PubSubDeferredPromise<T> {
  promise: Promise<void>;
  resolve: () => void;
  isDone: boolean;
  values: Array<T>;
}

function pubsubDeferredPromise<T = void>(): PubSubDeferredPromise<T> {
  let resolve!: () => void;
  const promise = new Promise<void>(resolveFn => {
    resolve = resolveFn;
  });

  return {
    promise,
    resolve,
    values: [],
    isDone: false,
  };
}

export interface PubSubEngine {
  publish<TPayload>(topic: string, payload: TPayload): void | Promise<void>;
  subscribe<TPayload>(...topics: [string, ...string[]]): AsyncGenerator<TPayload>;
  unsubscribe(...iterators: Array<AsyncGenerator<unknown>>): void | Promise<void>;
  close(): void | Promise<void>;
}

class BaseInMemoryPubSub {
  public withFilter: typeof withFilter = withFilter;

  protected readonly ValuePromiseMap: WeakMap<AsyncGenerator<unknown>, PubSubDeferredPromise<any>> = new WeakMap();

  protected readonly TopicIteratorMap: Map<string, Set<AsyncGenerator<unknown>>> = new Map();

  protected publishTopic<Topic extends string, Payload>(topic: Topic, payload: Payload) {
    const { TopicIteratorMap, ValuePromiseMap } = this;
    const iteratorSet = TopicIteratorMap.get(topic);

    if (iteratorSet == null) return;

    for (const iterator of iteratorSet) {
      const valuePromise = ValuePromiseMap.get(iterator);

      if (valuePromise == null) continue;

      valuePromise.values.push(payload);

      valuePromise.resolve();
    }
  }

  protected subscribeTopics<Topic extends string, Payload>(...topics: [Topic, ...Topic[]]): AsyncGenerator<Payload> {
    const { ValuePromiseMap, TopicIteratorMap } = this;

    const iterator = generator();

    const iteratorSets = topics.map(topic => {
      let iteratorSet = TopicIteratorMap.get(topic);

      if (iteratorSet == null) {
        iteratorSet = new Set();
        TopicIteratorMap.set(topic, iteratorSet);
      }

      iteratorSet.add(iterator);

      return iteratorSet;
    });

    let valuePromise: PubSubDeferredPromise<Payload> | null | undefined = topics.length ? pubsubDeferredPromise() : null;

    if (valuePromise) ValuePromiseMap.set(iterator, valuePromise);

    async function* generator(): AsyncGenerator<Payload> {
      while (valuePromise != null) {
        await valuePromise.promise;

        for (const value of valuePromise.values) yield value;

        if (valuePromise.isDone) {
          valuePromise = null;
          ValuePromiseMap.delete(iterator);
        } else {
          valuePromise = pubsubDeferredPromise();
          ValuePromiseMap.set(iterator, valuePromise);
        }
      }

      for (const iteratorSet of iteratorSets) {
        iteratorSet.delete(iterator);
      }
    }

    return iterator;
  }

  protected unsubscribeIterators(...iterators: AsyncGenerator<unknown>[]) {
    const { ValuePromiseMap } = this;

    for (const iterator of iterators) {
      const valuePromise = ValuePromiseMap.get(iterator);

      if (valuePromise == null) continue;

      valuePromise.resolve();
      valuePromise.isDone = true;
      ValuePromiseMap.delete(iterator);
    }
  }

  protected closeIterators() {
    const { TopicIteratorMap, ValuePromiseMap } = this;
    for (const [topic, iteratorSet] of TopicIteratorMap.entries()) {
      for (const iterator of iteratorSet) {
        const valuePromise = ValuePromiseMap.get(iterator);

        if (valuePromise == null) continue;

        valuePromise.resolve();
        valuePromise.isDone = true;
        ValuePromiseMap.delete(iterator);
      }
      iteratorSet.clear();
      TopicIteratorMap.delete(topic);
    }
  }
}

export class InMemoryPubSub extends BaseInMemoryPubSub implements PubSubEngine {
  publish<TPayload>(topic: string, payload: TPayload) {
    return this.publishTopic(topic, payload);
  }

  subscribe<TPayload = any>(...topics: [string, ...string[]]): AsyncGenerator<TPayload> {
    return this.subscribeTopics<string, TPayload>(...topics);
  }

  unsubscribe(...iterators: AsyncGenerator<unknown>[]) {
    return this.unsubscribeIterators(...iterators);
  }

  close() {
    return this.closeIterators();
  }
}

export interface StrictPubSubEngine<Topics extends Record<string, unknown>> {
  publish<Topic extends Exclude<keyof Topics, number | symbol>>(topic: Topic, payload: Topics[Topic]): void | Promise<void>;
  subscribe<Topic extends Exclude<keyof Topics, number | symbol>>(...topics: [Topic, ...Topic[]]): AsyncGenerator<Topics[Topic]>;
  unsubscribe(...iterators: Array<AsyncGenerator<unknown>>): void | Promise<void>;
  close(): void | Promise<void>;
}

export class StrictInMemoryPubSub<Topics extends Record<string, unknown>>
  extends BaseInMemoryPubSub
  implements StrictPubSubEngine<Topics>
{
  publish<Topic extends Exclude<keyof Topics, number | symbol>>(topic: Topic, payload: Topics[Topic]) {
    return this.publishTopic<Topic, Topics[Topic]>(topic, payload);
  }
  subscribe<Topic extends Exclude<keyof Topics, number | symbol>>(...topics: [Topic, ...Topic[]]) {
    return this.subscribeTopics<Topic, Topics[Topic]>(...topics);
  }
  unsubscribe(...iterators: Array<AsyncGenerator<unknown>>) {
    return this.unsubscribeIterators(...iterators);
  }
  close() {
    return this.closeIterators();
  }
}

export function withFilter<TData, TFilteredData extends TData>(
  iterator: AsyncGenerator<TData> | Promise<AsyncGenerator<TData>>,
  filter: (data: TData) => data is TFilteredData
): AsyncGenerator<TFilteredData>;
export function withFilter<TData>(
  iterator: AsyncGenerator<TData> | Promise<AsyncGenerator<TData>>,
  filter: (data: TData) => boolean
): AsyncGenerator<TData>;
export async function* withFilter<TData>(
  iterator: AsyncGenerator<TData> | Promise<AsyncGenerator<TData>>,
  filter: (data: TData) => boolean
) {
  for await (const value of await iterator) {
    if (filter(value)) yield value;
  }
}
