import { createDeferredPromise } from '@graphql-ez/utils/promise';
import { PassThrough } from 'stream';
import undici from 'undici';
import assert from 'assert';

export async function expectCommonQueryStream(address: string) {
  const client = new undici.Client(address);

  const done = createDeferredPromise();

  try {
    await client.stream(
      {
        path: '/graphql',
        method: 'POST',
        body: JSON.stringify({
          query: `
            query {
              stream @stream(initialCount: 1)
            }
            `,
        }),
        headers: {
          'content-type': 'application/json',
        },
        opaque: new PassThrough().setEncoding('utf8'),
      },
      ({ opaque, statusCode }) => {
        assert(opaque instanceof PassThrough);

        assert(statusCode === 200, 'Unexpected status code');

        (async () => {
          const chunks: string[] = [];

          for await (const chunk of opaque) {
            chunks.push(chunk);
          }

          assert(chunks[0]?.includes(`{"data":{"stream":["A"]},"hasNext":true}`));
          assert(chunks[1]?.includes(`{"data":"B","path":["stream",1],"hasNext":true}`));
          assert(chunks[2]?.includes(`{"data":"C","path":["stream",2],"hasNext":true}`));

          assert(chunks.length === 3, 'Incorrect amount of chunks');

          done.resolve();
        })().catch(done.reject);

        return opaque;
      }
    );

    await done.promise;
  } finally {
    await client.close();
  }
}
