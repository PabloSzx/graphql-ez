import { gql, startFastifyServer } from 'graphql-ez-testing';
import { generateHash, ezAutomaticPersistedQueries, PersistedQueryStore } from '../src';
import type { getRequestPool } from 'graphql-ez-testing/request';
import type { GraphQLParams } from '@pablosz/graphql-helix';

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
        add: (_: any, { x, y }: { x: number; y: number }) => x + y,
      },
    },
    typeDefs: gql`
      type Query {
        hello: String
        add(x: Int, y: Int): Int
      }
    `,
  };

  const query = `
  query AddQuery ($x: Int!, $y: Int!) {
      add(x: $x, y: $y)
  }`;

  const query2 = '{hello}';

  const TEST_STRING_QUERY = query;
  const sha256Hash = generateHash(query, 'sha256');
  const variables = { x: 1, y: 2 };
  const extensions = {
    persistedQuery: {
      version: 1,
      sha256Hash,
    },
  };

  const extensions2 = {
    persistedQuery: {
      version: 1,
      sha256Hash: generateHash(query2, 'sha256'),
    },
  };

  function createMockStore(): PersistedQueryStore {
    const map = new Map<string, string>();
    return {
      put: jest.fn((key, val) => {
        map.set(key, val);
      }),
      get: jest.fn((key) => map.get(key) ?? null),
    };
  }

  async function makeRequest(
    requestFn: RequestFnType,
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
      ...rest
    }
  }

  test('errors on invalid persistedQueries extension', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const res = await makeRequest(request, {
      variables,
      extensions: {
        persistedQuery: {},
      },
    });

    expect(res.data).not.toBeDefined();
    expect(res.errors).toBeDefined();
    expect(res.errors[0].message).toBe('Unsupported persisted query version');
    expect(res.errors[0].extensions.code).toBe('PERSISTED_QUERY_INVALID_VERSION');
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
      variables: { x: 1, y: 2 },
      extensions,
    });

    expect(result.body.data).toBeUndefined();
    expect(result.body.errors.length).toEqual(1);
    expect(result.body.errors[0].message).toEqual('PersistedQueryNotFound');
    expect(result.body.errors[0].extensions.code).toEqual(
      'PERSISTED_QUERY_NOT_FOUND',
    );
  });

  it('returns value on the first try if query is provided', async () => {
    const store = createMockStore();

    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ store })],
        },
      },
    });

    const result = await makeRequest(request, {
      query: query2,
      extensions: extensions2,
    });

    expect(store.put).toHaveBeenCalledWith(extensions2.persistedQuery.sha256Hash, query2);
    expect(result.data).toBe('hi');
    expect(result.errors).toBeUndefined();
  });

  it('returns result on the second try', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    await makeRequest(request, {
      variables: { x: 1, y: 2 },
      extensions,
    });

    const result = await makeRequest(request, {
      query,
      variables: { x: 1, y: 2 },
      extensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.add).toBe(3);
  });

  it('returns error when hash does not match', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    try {
      await makeRequest(request, {
        query,
        extensions: {
          persistedQuery: {
            version: 1,
            hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          }
        },
      });
    } catch (e: any) {
      expect(e.response).toBeDefined();
      expect(e.response.status).toEqual(400);
      expect(e.response.raw).toMatch(/does not match query/);
    }
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
      query: TEST_STRING_QUERY,
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
          message: 'Unsupported persisted query version',
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
      query: TEST_STRING_QUERY,
      variables,
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash,
        },
      },
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

    await makeRequest(request, {
      query,
      variables,
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash,
        },
      },
    });

    const result = await makeRequest(
      request,
      {
        query,
        variables,
        extensions
      },
      'GET'
    );

    expect(result?.data).toEqual(3);
  });

  it('returns with batched persisted queries', async () => {
    const { requestRaw } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [
            ezAutomaticPersistedQueries({}),
          ],
        },
        allowBatchedQueries: true,
      },
    });

    const errors = await makeRequestRaw(requestRaw, [
      {
        extensions,
      },
      {
        extensions: extensions2,
      },
    ]);

    expect(errors.body[0].data).toBeUndefined();
    expect(errors.body[1].data).toBeUndefined();
    expect(errors.body[0].errors[0].message).toEqual(
      'PersistedQueryNotFound',
    );
    expect(errors.body[0].errors[0].extensions.code).toEqual(
      'PERSISTED_QUERY_NOT_FOUND',
    );
    expect(errors.body[1].errors[0].message).toEqual(
      'PersistedQueryNotFound',
    );
    expect(errors.body[1].errors[0].extensions.code).toEqual(
      'PERSISTED_QUERY_NOT_FOUND',
    );

    const result = await makeRequestRaw(requestRaw, [
      {
        extensions,
        variables: { x: 7, y: 5 },
        query,
      },
      {
        extensions: extensions2,
        query: query2,
      },
    ]);

    expect(result.body[0].data).toBe(12);
    expect(result.body[0].data).toBe('hi');
    expect(result.body.errors).toBeUndefined();
  });

  it('works with different hash algorithms', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({
            hashAlgorithm: 'sha512'
          })],
        },
      },
    });

    const sha512Hash = generateHash(query2, 'sha512');
    const extensions = {
      persistedQuery: {
        version: 1,
        sha512Hash
      }
    }

    await makeRequest(request, {
      query: query2,
      extensions
    });

    const result = await makeRequest(request, {
      query: query2,
      extensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toBe('hi');
  });

  it('works with different extension resolution strategies', async () => {
    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({
            resolvePersistedQuery: () => {
              return {
                version: 1,
                query: query2,
                hash: extensions2.persistedQuery.sha256Hash
              };
            }
          })],
        },
      },
    });

    const ignoredExtensions = {
      persistedQuery: {
        version: 1,
        sha1Hash: 'lalalalalalalalalalalalalalalala'
      }
    }

    await makeRequest(request, {
      query: query2,
      extensions: ignoredExtensions
    });

    const result = await makeRequest(request, {
      query: query2,
      extensions: ignoredExtensions
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toBe('hi');
  });

  it('makes use of the provided store', async () => {
    const store = createMockStore();

    const { request } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ store })],
        },
      },
    });

    await makeRequest(request, {
      extensions,
    });

    expect(store.get).toHaveBeenCalledWith(extensions.persistedQuery.sha256Hash);

    const result = await makeRequest(request, {
      query,
      variables: { x: 1, y: 2 },
      extensions,
    });

    // expect(store.get).toHaveBeenCalledTimes(2);
    // expect(store.get).toHaveBeenLastCalledWith(extensions.persistedQuery.sha256Hash);
    expect(store.put).toHaveBeenCalledWith(extensions.persistedQuery.sha256Hash, query);

    expect(result.errors).toBeUndefined();
    expect(result.data?.add).toBe(3);

  });

});
