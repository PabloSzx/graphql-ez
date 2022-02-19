import {
  BuildAppOptions,
  CreateApp,
  createDeferredPromise,
  EZAppBuilder,
  EZContext,
  GetEnvelopedFn,
  LazyPromise,
  NextApiHandler,
  NextAppOptions,
  PromiseOrValue,
} from '@graphql-ez/nextjs';
import { cleanObject } from '@graphql-ez/utils/object';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { ExecutionResult, GraphQLSchema, print, printSchema, GraphQLError } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import { testApiHandler, NtarhParameters } from 'next-test-api-route-handler';

const teardownLazyPromiseList: Promise<void>[] = [];

export const GlobalTeardown = async () => {
  await Promise.allSettled(teardownLazyPromiseList);
};

export { testApiHandler };

export type TestFetch = Parameters<NtarhParameters['test']>[0]['fetch'];

export type QueryFunction = <TData, TVariables = {}, TExtensions = {}>(
  document: string | TypedDocumentNode<TData, TVariables>,
  args?: {
    variables?: TVariables | undefined;
    headers?: IncomingHttpHeaders | undefined;
    extensions?: Record<string, unknown> | undefined;
    operationName?: string | undefined;
  }
) => Promise<ExecutionResult<TData, TExtensions>>;

export type AssertedQuery = <TData = any, TVariables = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: {
    variables?: TVariables;
    headers?: IncomingHttpHeaders;
    extensions?: Record<string, unknown>;
    operationName?: string;
  }
) => Promise<TData>;

class GraphQLErrorJSON extends Error {
  constructor(message: string, public locations: GraphQLError['locations'], public extensions: GraphQLError['extensions']) {
    super(message);
  }
}

export async function CreateTestClient(
  ezApp: PromiseOrValue<(EZAppBuilder | NextAppOptions) & { getEnveloped?: never }>,
  options: {
    buildOptions?: BuildAppOptions;
    headers?: IncomingHttpHeaders;
  } = {}
): Promise<{
  testFetch: TestFetch;
  query: QueryFunction;
  mutation: QueryFunction;
  assertedQuery: AssertedQuery;
  getEnveloped: GetEnvelopedFn<EZContext>;
  schema: GraphQLSchema;
  schemaString: string;
  cleanup: () => Promise<void>;
}> {
  let ezHandler: NextApiHandler;

  ezApp = await ezApp;

  let getEnvelopedValue: GetEnvelopedFn<EZContext>;

  if ('asPreset' in ezApp && ezApp.asPreset) {
    const { buildApp } = CreateApp({
      ez: {
        preset: ezApp.asPreset,
      },
    });

    const { apiHandler, getEnveloped, ready } = buildApp(options.buildOptions);

    await ready;
    ezHandler = apiHandler;
    getEnvelopedValue = await getEnveloped;
  } else if (!('buildApp' in ezApp) && !('asPreset' in ezApp) && !('getEnveloped' in ezApp)) {
    const { buildApp } = CreateApp(ezApp);

    const { apiHandler, getEnveloped, ready } = buildApp(options.buildOptions);

    await ready;
    ezHandler = apiHandler;

    getEnvelopedValue = await getEnveloped;
  } else {
    throw Error('Invalid EZ App');
  }

  const isReadyPromise = createDeferredPromise();
  const cleanupPromise = createDeferredPromise();

  teardownLazyPromiseList.push(
    LazyPromise(() => {
      cleanupPromise.resolve();
    })
  );

  let testFetch!: TestFetch;

  const headers = cleanObject(options.headers);

  function getHeaders(headersArg: IncomingHttpHeaders | undefined): Record<string, any> {
    return cleanObject({
      ...headers,
      ...headersArg,
    });
  }

  const query: QueryFunction = async function query(
    document,
    { variables, headers: headersArg, operationName, extensions } = {}
  ) {
    if (cleanupPromise.value.current) throw Error(`Test client has already been cleaned up!`);

    const queryString = typeof document === 'string' ? document : print(document);

    const response = await testFetch({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...getHeaders(headersArg),
      },
      body: JSON.stringify({ query: queryString, variables, operationName, extensions }),
    });

    const data = (await response.json()) as ExecutionResult<any, any>;

    return data;
  };

  const assertedQuery: AssertedQuery = async (document, options) => {
    try {
      const result = await query(document, options);

      const { data, errors } = result;
      if (errors?.length) {
        if (errors.length > 1) {
          for (const err of errors) {
            console.error(err);
          }
          const err = Error('Multiple GraphQL Errors');
          Object.assign(err, { errors });
          throw err;
        } else {
          const err = errors[0]!;
          throw new GraphQLErrorJSON(err.message, err.locations, err.extensions);
        }
      } else if (!data) {
        throw Error('Data not found in: ' + JSON.stringify(result));
      }

      return data;
    } catch (err) {
      if (err instanceof Error) {
        Error.captureStackTrace(err, assertedQuery);
      }

      throw err;
    }
  };

  const doneTestApiHandler = testApiHandler({
    handler: ezHandler,
    async test({ fetch }) {
      testFetch = fetch;
      isReadyPromise.resolve();

      await cleanupPromise.promise;
    },
  }).catch(err => {
    isReadyPromise.reject(err);
  });

  await isReadyPromise.promise;

  const cleanup = async () => {
    cleanupPromise.resolve();

    await doneTestApiHandler;
  };

  return {
    testFetch,
    query,
    mutation: query,
    assertedQuery,
    getEnveloped: getEnvelopedValue,
    get schema() {
      return getEnvelopedValue().schema;
    },
    get schemaString() {
      return printSchema(getEnvelopedValue().schema);
    },
    cleanup,
  };
}
