import { buildSchema } from 'graphql';
import type { Plugin as EnvelopPlugin, SetSchemaFn } from 'graphql-ez';
import { gql, startFastifyServer } from 'graphql-ez-testing';
import { DisableContext, ezAutomaticPersistedQueries, generateHash, PersistedQueryStore } from '../src';

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

  it('errors on invalid persistedQueries extension', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const res = await query(undefined, {
      extensions: {
        persistedQuery: {},
      },
    });

    expect(res.data).not.toBeDefined();
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0]?.message).toBe('PersistedQueryNotFound');
    expect(res.errors?.[0]?.extensions?.code).toBe('PERSISTED_QUERY_NOT_FOUND');
  });

  it('returns PersistedQueryNotFound on the first try', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const result = await query(undefined, {
      extensions: addQueryExtensions,
    });

    expect(result.data).toBeUndefined();
    expect(result.errors?.length).toEqual(1);
    expect(result.errors?.[0]?.message).toEqual('PersistedQueryNotFound');
    expect(result.errors?.[0]?.extensions?.code).toEqual('PERSISTED_QUERY_NOT_FOUND');
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
      },
    };

    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ store })],
        },
      },
    });

    const result = await query<{
      hello: string;
    }>(helloQuery, {
      extensions: helloQueryExtensions,
    });

    expect(data.get(helloQueryExtensions.persistedQuery.sha256Hash)).toBeDefined();
    expect(result.data?.hello).toBe('hi');
    expect(result.errors).toBeUndefined();
  });

  it('returns results after the first try', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    await query(undefined, {
      extensions: addQueryExtensions,
    });

    let result = await query<{
      add: number;
    }>(addQuery, {
      variables: { x: 1, y: 2 },
      extensions: addQueryExtensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.add).toBe(3);

    result = await query<{
      add: number;
    }>(undefined, {
      variables: { x: 5, y: 3 },
      extensions: addQueryExtensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.add).toBe(8);
  });

  it('returns error when hash does not match', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const res = await query(addQuery, {
      extensions: {
        persistedQuery: {
          version: 1,
          hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      },
    });

    expect(res.http.statusCode).toBe(400);
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0]?.message).toMatch(/hash does not match query/);
  });

  it('errors when version is not specified', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const result = await query(addQuery, {
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
    const { query } = await startFastifyServer({
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

    const result = await query(addQuery, {
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
    const { batchedQueries } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({})],
        },
        allowBatchedQueries: true,
      },
    });

    const errors = await batchedQueries([
      {
        extensions: addQueryExtensions,
      },
      {
        extensions: helloQueryExtensions,
      },
    ]);

    expect(errors.result[0]?.data).toBeUndefined();
    expect(errors.result[1]?.data).toBeUndefined();
    expect(errors.result[0]?.errors?.[0]?.message).toEqual('PersistedQueryNotFound');
    expect(errors.result[0]?.errors?.[0]?.extensions?.code).toEqual('PERSISTED_QUERY_NOT_FOUND');
    expect(errors.result[1]?.errors?.[0]?.message).toEqual('PersistedQueryNotFound');
    expect(errors.result[1]?.errors?.[0]?.extensions?.code).toEqual('PERSISTED_QUERY_NOT_FOUND');

    const result = await batchedQueries([
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

    expect(result.result?.[0]?.data?.add).toBe(12);
    expect(result.result?.[1]?.data?.hello).toBe('hi');
    expect(result.result?.[0]?.errors).toBeUndefined();
    expect(result.result?.[1]?.errors).toBeUndefined();
  });

  it('works with different hash algorithms', async () => {
    const { query } = await startFastifyServer({
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

    await query(helloQuery, {
      extensions,
    });

    const result = await query<{
      hello: string;
    }>(helloQuery, {
      extensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.hello).toBe('hi');
  });

  it('works with different extension resolution strategies', async () => {
    const { query } = await startFastifyServer({
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

    await query(helloQuery, {
      extensions: ignoredExtensions,
    });

    const result = await query<{
      hello: string;
    }>(helloQuery, {
      extensions: ignoredExtensions,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.hello).toBe('hi');
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
      },
    };

    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ store })],
        },
      },
    });

    await query(undefined, {
      extensions: addQueryExtensions,
    });

    expect(getCount).toBe(1);

    const result = await query<{
      add: number;
    }>(addQuery, {
      variables: { x: 5, y: 5 },
      extensions: addQueryExtensions,
    });

    const value = data.get(addQueryExtensions.persistedQuery.sha256Hash);
    expect(value).toBe(addQuery);

    expect(result.errors).toBeUndefined();
    expect(result.data?.add).toBe(10);
  });

  it('can be disabled dynamically', async () => {
    const disableIf = (context: DisableContext): boolean => context.operationName === 'query.disable';

    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ disableIf })],
        },
      },
    });

    const res = await query(undefined, {
      extensions: addQueryExtensions,
    });

    expect(res.errors?.length).toEqual(1);
    expect(res.errors?.[0]?.message).toEqual('PersistedQueryNotFound');

    const result = await query(addQuery, {
      operationName: 'query.disable',
      variables: { x: 5, y: 5 },
      extensions: addQueryExtensions,
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toEqual('PersistedQueryNotSupported');
    expect(result.errors?.[0]?.extensions?.code).toEqual('PERSISTED_QUERY_NOT_SUPPORTED');
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
      clear: jest.fn(),
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
          plugins: [pluginTrigger],
        },
      },
    });

    const newSchema = buildSchema(`type Query { foo: String! }`);
    setSchemaFn(newSchema);

    expect(store.clear).toHaveBeenCalled();
  });

  it('sets non-cacheable headers on PersistedQueryNotFound', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries()],
        },
      },
    });

    const res = await query(undefined, {
      extensions: addQueryExtensions,
    });

    expect(res.errors?.[0]?.message).toEqual('PersistedQueryNotFound');
    expect(res.http.headers?.['cache-control']).toBe('private, no-cache, must-revalidate');
  });

  it('sets non-cacheable headers on PersistedQueryNotSupported', async () => {
    const { query } = await startFastifyServer({
      createOptions: {
        schema: [testSchema],
        ez: {
          plugins: [ezAutomaticPersistedQueries({ disableIf: () => true })],
        },
      },
    });

    const res = await query(undefined, {
      extensions: addQueryExtensions,
    });

    expect(res.errors?.[0]?.message).toEqual('PersistedQueryNotSupported');
    expect(res.http.headers?.['cache-control']).toBe('private, no-cache, must-revalidate');
  });
});
