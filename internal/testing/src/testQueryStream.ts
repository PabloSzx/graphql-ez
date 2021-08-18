import { createDeferredPromise } from 'graphql-ez/utils/promise';
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

        expect(statusCode).toBe(200);

        (async () => {
          const chunks: string[] = [];

          for await (const chunk of opaque) {
            chunks.push(chunk);
          }

          expect(chunks[0]).toContain(`{"data":{"stream":["A"]},"hasNext":true}`);
          expect(chunks[1]).toContain(`{"data":"B","path":["stream",1],"hasNext":true}`);
          expect(chunks[2]).toContain(`{"data":"C","path":["stream",2],"hasNext":true}`);

          expect(chunks).toHaveLength(3);

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
