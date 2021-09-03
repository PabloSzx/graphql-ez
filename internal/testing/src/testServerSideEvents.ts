import EventSource from 'eventsource';
import { createDeferredPromise } from '@graphql-ez/utils/promise';
import { deepStrictEqual } from 'assert';
export async function expectCommonServerSideEventSubscription(address: string) {
  const eventSource = new EventSource(`${address}/graphql?query=subscription{ping}`);

  const done = createDeferredPromise(5000);
  try {
    let n = 0;
    eventSource.addEventListener('message', (event: any) => {
      try {
        switch (++n) {
          case 1:
            return deepStrictEqual(JSON.parse(event.data), {
              data: {
                ping: 'pong1',
              },
            });
          case 2:
            return deepStrictEqual(JSON.parse(event.data), {
              data: {
                ping: 'pong2',
              },
            });
          case 3:
            deepStrictEqual(JSON.parse(event.data), {
              data: {
                ping: 'pong3',
              },
            });
            return done.resolve();
          default:
            done.reject(Error('Unexpected event: ' + JSON.stringify(event.data)));
        }
      } catch (err) {
        done.reject(err);
      }
    });

    await done.promise;
  } finally {
    eventSource.close();
  }
}
