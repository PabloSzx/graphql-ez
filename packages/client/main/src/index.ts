import { documentParamsToURIParams } from '@graphql-ez/utils/clientURI';
import { cleanObject } from '@graphql-ez/utils/object';
import { getURLWebsocketVersion } from '@graphql-ez/utils/url';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { ExecutionResult, GraphQLError } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import { Dispatcher, Pool } from 'undici';
import { createSSESubscription, SubscribeSSE } from './sse';
import { createStreamHelper, Stream } from './stream';
import type { SubscribeFunction, SubscribeOptions } from './types';
import { createUploadQuery } from './upload';
import { getQueryString } from './utils';
import { createGraphQLWSWebsocketsClient, GraphQLWSClient, GraphQLWSClientOptions } from './websockets/graphql-ws';
import {
  createSubscriptionsTransportWebsocketsClient,
  SubscriptionsTransportClient,
  SubscriptionsTransportClientOptions,
} from './websockets/subscriptions-transport';

export interface EZClientOptions {
  endpoint: string | URL;
  headers?: IncomingHttpHeaders;
  graphQLWSClientOptions?: Partial<GraphQLWSClientOptions>;
  subscriptionsTransportClientOptions?: SubscriptionsTransportClientOptions;
  undiciOptions?: Pool.Options;
}

class GraphQLErrorJSON extends Error {
  public locations: GraphQLError['locations'] | undefined;
  public extensions: GraphQLError['extensions'] | undefined;
  constructor(message: string, locations: GraphQLError['locations'], extensions: GraphQLError['extensions']) {
    super(message);
    if (locations) this.locations = locations;
    if (extensions) this.extensions = extensions;
  }
}

export interface QueryOptions<TVariables extends Record<string, any>> {
  variables?: TVariables;
  headers?: IncomingHttpHeaders;
  /**
   * @default "POST"
   */
  method?: 'GET' | 'POST';
  extensions?: Record<string, unknown>;
  operationName?: string;
  /**
   * Customize and/or override the default undici request options
   */
  requestOptions?: Partial<Dispatcher.RequestOptions>;
}

export type QueryFunctionPostGet = <TData, TVariables extends Record<string, any> = {}, TExtensions = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: QueryOptions<TVariables>
) => Promise<ExecutionResult<TData, TExtensions>>;

export type QueryFunctionPost = <TData, TVariables extends Record<string, any> = {}, TExtensions = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: Omit<QueryOptions<TVariables>, 'method'>
) => Promise<ExecutionResult<TData, TExtensions>>;

export type AssertedQuery = <TData = any, TVariables extends Record<string, any> = Record<string, unknown>>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: QueryOptions<TVariables>
) => Promise<TData>;

export function EZClient(options: EZClientOptions): EZClientInstance {
  const endpoint = new URL(options.endpoint);

  const websocketEndpoint = getURLWebsocketVersion(
    typeof options.endpoint === 'string' ? options.endpoint : options.endpoint.href
  ).href;

  const endpointHref = endpoint.href;
  const endpointOrigin = endpoint.origin;

  const endpointPathname = endpoint.pathname;

  const client = new Pool(endpointOrigin, {
    ...options.undiciOptions,
  });

  const graphqlWS = createGraphQLWSWebsocketsClient(websocketEndpoint, options.graphQLWSClientOptions);

  const legacyTransport = createSubscriptionsTransportWebsocketsClient(
    websocketEndpoint,
    options.subscriptionsTransportClientOptions
  );

  const headers = cleanObject(options.headers);

  function getHeaders(headersArg: IncomingHttpHeaders | undefined) {
    return cleanObject({
      ...headers,
      ...headersArg,
    });
  }

  const query: QueryFunctionPostGet = async function query(
    document,
    { variables, headers: headersArg, method = 'POST', extensions, operationName, requestOptions } = {}
  ) {
    const { body, headers } = await client.request(
      method === 'GET'
        ? {
            method: 'GET',
            headers: getHeaders(headersArg),
            path:
              endpointPathname +
              documentParamsToURIParams({ query: getQueryString(document), extensions, operationName, variables }),
            ...requestOptions,
          }
        : {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...getHeaders(headersArg),
            },
            body: JSON.stringify({ query: getQueryString(document), extensions, operationName, variables }),
            path: endpointPathname,
            ...requestOptions,
          }
    );

    if (!headers['content-type']?.startsWith('application/json')) {
      const errorBody = (await body.text().catch(() => null)) || 'No body';
      throw Error(`Unexpected content type received: ${headers['content-type']}, BodyText: ${errorBody}`);
    }

    const json = await body.json();

    return json;
  };

  const queryPost: QueryFunctionPost = function queryPost(document, options) {
    return query(document, { ...options, method: 'POST' });
  };

  const assertedQuery: AssertedQuery = async (document, options) => {
    try {
      const result = await query(document, options);

      const { data, errors } = result;
      if (errors?.length) {
        if (errors.length > 1) {
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

  const subscribe: SubscribeFunction = function subscribe<TData, TVariables extends Record<string, unknown> = {}>(
    document: TypedDocumentNode<TData, TVariables> | string,
    options?: SubscribeOptions<TData, TVariables>
  ) {
    return graphqlWS.subscribe(document, options);
  };

  const legacySubscribe: SubscribeFunction = function subscribe<TData, TVariables extends Record<string, unknown> = {}>(
    document: TypedDocumentNode<TData, TVariables> | string,
    options?: SubscribeOptions<TData, TVariables>
  ) {
    return legacyTransport.subscribe(document, options);
  };

  return {
    query,
    mutation: queryPost,
    assertedQuery,
    websockets: {
      subscribe,
      client: graphqlWS.client,
      legacy: {
        subscribe: legacySubscribe,
        client: legacyTransport.client,
      },
    },
    stream: createStreamHelper(client, endpointPathname, getHeaders),
    sseSubscribe: createSSESubscription(endpointHref, getHeaders),
    client,
    headers,
    setHeaders(headersToAssign: IncomingHttpHeaders) {
      Object.assign(headers, headersToAssign);
    },
    uploadQuery: createUploadQuery(endpointHref, getHeaders, queryPost),
  };
}

export interface EZClientInstance {
  query: QueryFunctionPostGet;
  mutation: QueryFunctionPost;
  assertedQuery: AssertedQuery;
  websockets: {
    subscribe: SubscribeFunction<{}>;
    client: Promise<GraphQLWSClient>;
    legacy: {
      subscribe: SubscribeFunction<{}>;
      client: Promise<SubscriptionsTransportClient>;
    };
  };
  stream: Stream;
  sseSubscribe: SubscribeSSE;
  client: Pool;
  headers: Partial<IncomingHttpHeaders>;
  setHeaders(headersToAssign: Partial<IncomingHttpHeaders>): void;
  uploadQuery: QueryFunctionPost;
}
