import fetch from 'node-fetch';

import {
  createUploadFileBody,
  gql,
  readStreamToBuffer,
  startExpressServer,
  startFastifyServer,
  startKoaServer,
} from '@graphql-ez/testing-new';

import { ezUpload } from '../src/index';

const uploadBase64Schema = {
  typeDefs: gql`
    type Mutation {
      uploadFileToBase64(file: Upload!): String!
    }
    type Query {
      hello: String
    }
  `,
  resolvers: {
    Mutation: {
      async uploadFileToBase64(
        _root: unknown,
        {
          file,
        }: {
          file: Promise<{ createReadStream(): any }>;
        }
      ) {
        return (await readStreamToBuffer(file)).toString('base64');
      },
    },
    Query: {
      hello() {
        return 'world';
      },
    },
  },
};

test('fastify', async () => {
  const { server } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezUpload()],
      },
      schema: uploadBase64Schema,
    },
  });

  const fileMessage = 'hello-world';

  const body = createUploadFileBody(fileMessage);
  const res = await server.inject({
    method: 'POST',
    url: '/graphql',
    headers: body.getHeaders(),
    payload: body,
  });

  const { data } = JSON.parse(res.body);
  expect(data).toMatchInlineSnapshot(`
    Object {
      "uploadFileToBase64": "aGVsbG8td29ybGQ=",
    }
  `);

  const recovered = Buffer.from(data.uploadFileToBase64, 'base64').toString('utf-8');

  expect(recovered).toBe(fileMessage);

  expect(res.statusCode).toBe(200);
});

test('express', async () => {
  const { address } = await startExpressServer({
    createOptions: {
      ez: {
        plugins: [ezUpload()],
      },
      schema: uploadBase64Schema,
    },
  });

  const fileMessage = 'hello-world';

  const body = createUploadFileBody(fileMessage);

  const response = await fetch(address + '/graphql', {
    body,
    method: 'POST',
    headers: body.getHeaders(),
  });

  expect(await response.clone().text()).toMatchInlineSnapshot(`"{\\"data\\":{\\"uploadFileToBase64\\":\\"aGVsbG8td29ybGQ=\\"}}"`);

  expect(response.status).toBe(200);

  const { data } = await response.json();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "uploadFileToBase64": "aGVsbG8td29ybGQ=",
    }
  `);

  const recovered = Buffer.from(data.uploadFileToBase64, 'base64').toString('utf-8');

  expect(recovered).toBe(fileMessage);

  expect(response.status).toBe(200);
});

test('koa', async () => {
  const { address } = await startKoaServer({
    createOptions: {
      ez: {
        plugins: [ezUpload()],
      },
      schema: uploadBase64Schema,
    },
  });

  const fileMessage = 'hello-world';

  const body = createUploadFileBody(fileMessage);

  const response = await fetch(address + '/graphql', {
    body,
    method: 'POST',
    headers: body.getHeaders(),
  });

  expect(await response.clone().text()).toMatchInlineSnapshot(`"{\\"data\\":{\\"uploadFileToBase64\\":\\"aGVsbG8td29ybGQ=\\"}}"`);

  expect(response.status).toBe(200);

  const { data } = await response.json();
  expect(data).toMatchInlineSnapshot(`
    Object {
      "uploadFileToBase64": "aGVsbG8td29ybGQ=",
    }
  `);

  const recovered = Buffer.from(data.uploadFileToBase64, 'base64').toString('utf-8');

  expect(recovered).toBe(fileMessage);

  expect(response.status).toBe(200);
});
