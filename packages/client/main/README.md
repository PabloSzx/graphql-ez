# @graphql-ez/client

Fully feature GraphQL Client for Node.js

## Features

- [x] [@graphql-typed-document-node](https://www.npmjs.com/package/@graphql-typed-document-node/core) support
- [x] High performance HTTP/s using [undici](https://github.com/nodejs/undici)
- [x] [graphql-ws](https://github.com/enisdenjo/graphql-ws) support
- [x] Legacy [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws) support
- [x] [Defer and Stream](https://github.com/graphql/graphql-js/pull/2319) support
- [x] [graphql-helix](https://github.com/contra/graphql-helix) SSE support
- [x] [GraphQL Upload](https://github.com/jaydenseric/graphql-upload) support

> By default if you only use the traditional GraphQL over HTTP, any other external dependency is not imported

## Usage

```ts
import { EZClient } from '@graphql-ez/client';

export const ezClient = EZClient({
  endpoint: 'http://localhost:8080/api/graphql',
});
```

### HTTP

```ts
await ezClient.query('query($n: Int!) { hello(n: $n) }', {
  variables: {
    n: 10,
  },
  // "POST" by default
  method: 'GET',
});

await ezClient.mutation('mutation { hello }', {
  headers: {
    authorization: 'foo',
  },
});

// Automatically throw if any error is returned
await ezClient.assertedQuery('mutation { hello }', {
  // ...
});
```

### Websockets

#### graphql-ws

```ts
const { iterator, unsubscribe } = ezClient.websockets.subscribe('subscription{ping}');

for await (const value of iterator) {
  console.log(value);
}

await unsubscribe();

(await ezClient.websockets.client).dispose();
```

#### Legacy subscriptions-transport-ws

```ts
const { iterator, unsubscribe } = ezClient.websockets.legacy.subscribe('subscription{ping}');

for await (const value of iterator) {
  console.log(value);
}

await unsubscribe();

(await ezClient.websockets.legacy.client).close();
```

### Defer and Stream

```ts
const { iterator } = ezClient.stream('{stream @stream(initialCount: 1)}');

let i = 0;
for await (const value of iterator) {
  switch (++i) {
    case 1:
      expect(value).toContain(`{"data":{"stream":["A"]},"hasNext":true}`);
      break;
    case 2:
      expect(value).toContain(`{"data":"B","path":["stream",1],"hasNext":true}`);
      break;
    case 3:
      expect(value).toContain(`{"data":"C","path":["stream",2],"hasNext":true}`);
      break;
  }
}
```

### SSE

```ts
const { iterator, unsubscribe } = ezClient.sseSubscribe('subscription{ping}');

for await (const value of iterator) {
  console.log(value);
}

await unsubscribe();
```

### GraphQL Upload

```ts
const { data, errors } = await ezClient.uploadQuery('mutation($file: Upload!) { uploadFile(file:$file) }', {
  variables: {
    file: Buffer.from('hello-world'),
  },
});
```

## LICENSE

MIT
