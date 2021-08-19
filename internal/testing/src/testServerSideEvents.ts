import EventSource from 'eventsource';
import { createDeferredPromise } from '@graphql-ez/utils/promise';

export async function expectCommonServerSideEventSubscription(address: string) {
  const eventSource = new EventSource(`${address}/graphql?query=subscription{ping}`);

  const done = createDeferredPromise(5000);
  try {
    let n = 0;
    eventSource.addEventListener('message', (event: any) => {
      try {
        switch (++n) {
          case 1:
            return expect(JSON.parse(event.data)).toStrictEqual({
              data: {
                ping: 'pong1',
              },
            });
          case 2:
            return expect(JSON.parse(event.data)).toStrictEqual({
              data: {
                ping: 'pong2',
              },
            });
          case 3:
            expect(JSON.parse(event.data)).toStrictEqual({
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
