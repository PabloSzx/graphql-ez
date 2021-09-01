import assert from 'assert';
import {
  createUploadFileBody,
  FileUpload,
  gql,
  readStreamToBuffer,
  startExpressServer,
  startFastifyServer,
  startKoaServer,
  UploadFileDocument,
} from 'graphql-ez-testing';
import nodeFetch from 'node-fetch';

import { CreateTestClient as CreateFastifyTestClient, GlobalTeardown } from '@graphql-ez/fastify-testing';
import { ezSchema } from '@graphql-ez/plugin-schema';

import { ezUpload } from '../src/index';

afterAll(GlobalTeardown);

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
          file: Promise<FileUpload>;
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

test('fastify on test client', async () => {
  const fileMessage = 'hello-world';

  const { uploadQuery } = await CreateFastifyTestClient({
    ez: {
      plugins: [
        ezUpload(),
        ezSchema({
          schema: uploadBase64Schema,
        }),
      ],
    },
  });

  const { data, errors } = await uploadQuery(UploadFileDocument, {
    variables: {
      file: Buffer.from(fileMessage),
    },
  });

  expect(errors).toBeFalsy();

  assert(data);

  const recovered = Buffer.from(data.uploadFileToBase64, 'base64').toString('utf-8');

  expect(recovered).toBe(fileMessage);
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

  const response = await nodeFetch(address + '/graphql', {
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

  const response = await nodeFetch(address + '/graphql', {
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
