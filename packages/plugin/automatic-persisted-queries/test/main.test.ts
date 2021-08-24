import { gql, startFastifyServer } from 'graphql-ez-testing';
import { generateHash, ezAutomaticPersistedQueries, PersistedQueryStore, DisableContext } from '../src';
import type { getRequestPool } from 'graphql-ez-testing/request';
import type { GraphQLParams } from '@pablosz/graphql-helix';
import type { Plugin as EnvelopPlugin, SetSchemaFn } from 'graphql-ez';
import { buildSchema } from 'graphql';

type RequestPoolType = ReturnType<typeof getRequestPool>;
type RequestFnType = RequestPoolType['request'];
type RawRequestFnType = RequestPoolType['requestRaw'];

interface Operation extends GraphQLParams {
  extensions?: Record<string, any>;
}

describe('ezAutomaticPersistedQueries', () => {
  const testSchema = {
    resolvers: {
      Query: {
        hello: () => 'hi',
        add: (_: unknown, { x, y }: { x: number; y: number }) => x + y,
      },
    },
    typeDefs: gql`
      type Query {
        hello: String
        add(x: Int, y: Int): Int
      }
    `,
  };

  const addQuery = `
  query AddQuery ($x: Int!, $y: Int!) {
      add(x: $x, y: $y)
  }`;

  const helloQuery = '{hello}';

  const sha256Hash = generateHash(addQuery, 'sha256');
  const variables = { x: 1, y: 2 };
  const addQueryExtensions = {
    persistedQuery: {
      version: 1,
      sha256Hash,
    },
  };

  const helloQueryExtensions = {
    persistedQuery: {
      version: 1,
      sha256Hash: generateHash(helloQuery, 'sha256'),
    },
  };

  async function makeRequest(
    requestFn: RequestFnType,
    operation: Operation | Operation[],
    method: 'GET' | 'POST' = 'POST'
  ): Promise<any> {
    const options = {
      method,
      path: '/graphql',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(operation),
    };
    const res = await requestFn(options);

    return JSON.parse(res);
  }

  async function makeRequestRaw(
    requestFn: RawRequestFnType,
    operation: Operation | Operation[],
    method: 'GET' | 'POST' = 'POST'
  ): Promise<any> {
    const res = await requestFn({
      method,
      path: '/graphql',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(operation),
    });
    const { body: _body, ...rest } = res;
    const body = JSON.parse(await _body);
    return {
      body,
      ...rest,
    };
  }

  it('errors on invalid persistedQueries extension', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const res = await makeRequest(request, {
      extensions: {
        persistedQuery: {},
      },
    });

    expect(res.data).not.toBeDefined();
    expect(res.errors).toBeDefined();
    expect(res.errors[0].message).toBe('PersistedQueryNotFound');
    expect(res.errors[0].extensions.code).toBe('PERSISTED_QUERY_NOT_FOUND');
  });

  it('returns PersistedQueryNotFound on the first try', async () => {
    const { requestRaw } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const result = await makeRequestRaw(requestRaw, {
      extensions: addQueryExtensions,
    });

    expect(result.body.data).toBeUndefined();
    expect(result.body.errors.length).toEqual(1);
    expect(result.body.errors[0].message).toEqual('PersistedQueryNotFound');
    expect(result.body.errors[0].extensions.code).toEqual('PERSISTED_QUERY_NOT_FOUND');
  });

  it('returns value on the first try if query is provided', async () => {
    const data = new Map<string, string>();
    const store: PersistedQueryStore = {
      async get(hash: string) {
        return data.get(hash) ?? null;
      },
      async set(hash, doc) {
        data.set(hash, doc);
      },
      clear() {
        data.clear();
      }
    };

    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ store })],
        },
      },
    });

    const result = await makeRequest(request, {
      query: helloQuery,
      extensions: helloQueryExtensions,
    });

    expect(data.get(helloQueryExtensions.persistedQuery.sha256Hash)).toBeDefined();
    expect(result.data.hello).toBe('hi');
    expect(result.errors).toBeUndefined();
  });

  it('returns results after the first try', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    await makeRequest(request, {
      extensions: addQueryExtensions,
    });

    let result = await makeRequest(request, {
      query: addQuery,
      variables: { x: 1, y: 2 },
      extensions: addQueryExtensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.add).toBe(3);

    result = await makeRequest(request, {
      variables: { x: 5, y: 3 },
      extensions: addQueryExtensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.add).toBe(8);
  });

  it('returns error when hash does not match', async () => {
    const { requestRaw } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const res = await makeRequestRaw(requestRaw, {
      query: addQuery,
      extensions: {
        persistedQuery: {
          version: 1,
          hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.length).toBe(1);
    expect(res.body.errors[0].message).toMatch(/hash does not match query/);
  });

  it('errors when version is not specified', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const result = await makeRequest(request, {
      query: addQuery,
      variables,
      extensions: {
        persistedQuery: {
          // version omitted
          sha256Hash,
        },
      },
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'PersistedQueryNotFound',
        }),
      ])
    );
  });

  it('errors on version mismatch', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [
            ezAutomaticPersistedQueries({
              version: 10,
            }),
          ],
        },
      },
    });

    const result = await makeRequest(request, {
      query: addQuery,
      variables,
      extensions: addQueryExtensions,
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Unsupported persisted query version',
        }),
      ])
    );
  });

  it('returns correct result using get request', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({})],
        },
      },
    });

    await query(undefined, {
      extensions: addQueryExtensions,
    });

    const result = await query<{
      add: number;
    }>(addQuery, {
      variables,
      extensions: addQueryExtensions,
      method: 'GET',
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.add).toEqual(3);
  });

  it('returns with batched persisted queries', async () => {
    const { requestRaw } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({})],
        },
        allowBatchedQueries: true,
      },
    });

    const errors = await makeRequestRaw(requestRaw, [
      {
        extensions: addQueryExtensions,
      },
      {
        extensions: helloQueryExtensions,
      },
    ]);

    expect(errors.body[0].data).toBeUndefined();
    expect(errors.body[1].data).toBeUndefined();
    expect(errors.body[0].errors[0].message).toEqual('PersistedQueryNotFound');
    expect(errors.body[0].errors[0].extensions.code).toEqual('PERSISTED_QUERY_NOT_FOUND');
    expect(errors.body[1].errors[0].message).toEqual('PersistedQueryNotFound');
    expect(errors.body[1].errors[0].extensions.code).toEqual('PERSISTED_QUERY_NOT_FOUND');

    const result = await makeRequestRaw(requestRaw, [
      {
        extensions: addQueryExtensions,
        variables: { x: 7, y: 5 },
        query: addQuery,
      },
      {
        extensions: helloQueryExtensions,
        query: helloQuery,
      },
    ]);

    expect(result.body[0].data.add).toBe(12);
    expect(result.body[1].data.hello).toBe('hi');
    expect(result.body.errors).toBeUndefined();
  });

  it('works with different hash algorithms', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [
            ezAutomaticPersistedQueries({
              hashAlgorithm: 'sha512',
            }),
          ],
        },
      },
    });

    const sha512Hash = generateHash(helloQuery, 'sha512');
    const extensions = {
      persistedQuery: {
        version: 1,
        sha512Hash,
      },
    };

    await makeRequest(request, {
      query: helloQuery,
      extensions,
    });

    const result = await makeRequest(request, {
      query: helloQuery,
      extensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.hello).toBe('hi');
  });

  it('works with different extension resolution strategies', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [
            ezAutomaticPersistedQueries({
              resolvePersistedQuery: () => {
                return {
                  version: 1,
                  hash: helloQueryExtensions.persistedQuery.sha256Hash,
                };
              },
            }),
          ],
        },
      },
    });

    const ignoredExtensions = {
      persistedQuery: {
        version: 1,
        sha1Hash: 'lalalalalalalalalalalalalalalala',
      },
    };

    await makeRequest(request, {
      query: helloQuery,
      extensions: ignoredExtensions,
    });

    const result = await makeRequest(request, {
      query: helloQuery,
      extensions: ignoredExtensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.hello).toBe('hi');
  });

  it('makes use of the provided store', async () => {
    const data = new Map<string, string>();
    let getCount = 0;

    const store: PersistedQueryStore = {
      async get(hash: string) {
        getCount++;
        return data.get(hash) ?? null;
      },
      async set(hash, doc) {
        data.set(hash, doc);
      },
      clear() {
        data.clear();
      }
    };

    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ store })],
        },
      },
    });

    await makeRequest(request, {
      extensions: addQueryExtensions,
    });

    expect(getCount).toBe(1);

    const result = await makeRequest(request, {
      query: addQuery,
      variables: { x: 5, y: 5 },
      extensions: addQueryExtensions,
    });

    const value = data.get(addQueryExtensions.persistedQuery.sha256Hash);
    expect(value).toBe(addQuery);

    expect(result.errors).toBeUndefined();
    expect(result.data.add).toBe(10);
  });

  it('can be disabled dynamically', async () => {
    const disableIf = (context: DisableContext): boolean => context.operationName === 'query.disable';

    const { requestRaw } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ disableIf })],
        },
      },
    });

    const res = await makeRequestRaw(requestRaw, {
      extensions: addQueryExtensions,
    });

    expect(res.body.errors.length).toEqual(1);
    expect(res.body.errors[0].message).toEqual('PersistedQueryNotFound');

    const result = await makeRequestRaw(requestRaw, {
      query: addQuery,
      operationName: 'query.disable',
      variables: { x: 5, y: 5 },
      extensions: addQueryExtensions,
    });

    expect(result.body.errors).toBeDefined();
    expect(result.body.errors[0].message).toEqual('PersistedQueryNotSupported');
    expect(result.body.errors[0].extensions.code).toEqual('PERSISTED_QUERY_NOT_SUPPORTED');
  });

  it('clears the store on schema change', async () => {
    const data = new Map<string, string>();

    const store: PersistedQueryStore = {
      async get(hash: string) {
        return data.get(hash) ?? null;
      },
      async set(hash, doc) {
        data.set(hash, doc);
      },
      clear: jest.fn()
    };

    let setSchemaFn: SetSchemaFn = () => {};

    const pluginTrigger: EnvelopPlugin = {
      onPluginInit({ setSchema }) {
        setSchemaFn = setSchema;
      },
    };

    await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ store })],
        },
        envelop: {
          plugins: [pluginTrigger]
        }
      },
    });

    const newSchema = buildSchema(`type Query { foo: String! }`);
    setSchemaFn(newSchema);

    expect(store.clear).toHaveBeenCalled();
  });
});
