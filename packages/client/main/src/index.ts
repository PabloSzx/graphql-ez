import { documentParamsToURIParams } from '@graphql-ez/utils/clientURI';
import { cleanObject } from '@graphql-ez/utils/object';
import { getURLWebsocketVersion } from '@graphql-ez/utils/url';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { ExecutionResult, GraphQLError } from 'graphql';
import type { IncomingHttpHeaders } from 'http';
import { Client, Dispatcher } from 'undici';
import { createSSESubscription } from './sse';
import { createStreamHelper } from './stream';
import type { SubscribeFunction, SubscribeOptions } from './types';
import { createUploadQuery } from './upload';
import { getQueryString } from './utils';
import { createGraphQLWSWebsocketsClient, GraphQLWSClientOptions } from './websockets/graphql-ws';
import {
  createSubscriptionsTransportWebsocketsClient,
  SubscriptionsTransportClientOptions,
} from './websockets/subscriptions-transport';

export interface EZClientOptions {
  endpoint: string | URL;
  headers?: IncomingHttpHeaders;
  graphQLWSClientOptions?: Partial<GraphQLWSClientOptions>;
  subscriptionsTransportClientOptions?: SubscriptionsTransportClientOptions;
  unidiClientOptions?: Client.Options;
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

export interface QueryOptions<TVariables = {}> {
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

export type QueryFunctionPostGet = <TData, TVariables = {}, TExtensions = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: QueryOptions
) => Promise<ExecutionResult<TData, TExtensions>>;

export type QueryFunctionPost = <TData, TVariables = {}, TExtensions = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: Omit<QueryOptions, 'method'>
) => Promise<ExecutionResult<TData, TExtensions>>;

export type AssertedQuery = <TData = any, TVariables = {}>(
  document: TypedDocumentNode<TData, TVariables> | string,
  options?: QueryOptions
) => Promise<TData>;

export function EZClient(options: EZClientOptions) {
  const endpoint = new URL(options.endpoint);

  const websocketEndpoint = getURLWebsocketVersion(
    typeof options.endpoint === 'string' ? options.endpoint : options.endpoint.href
  ).href;

  const endpointHref = endpoint.href;
  const endpointOrigin = endpoint.origin;

  const endpointPathname = endpoint.pathname;

  const client = new Client(endpointOrigin, options.unidiClientOptions);

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
      console.error({
        body: await body.text(),
        headers,
      });
      throw Error('Unexpected content type received: ' + headers['content-type']);
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

  const subscribe: SubscribeFunction = function subscribe<TData, TVariables extends Record<string, unknown> = {}>(
    document: TypedDocumentNode<TData, TVariables> | string,
    options?: SubscribeOptions<TData, TVariables>
  ) {
    return graphqlWS.subscribe(document, { ...options, headers: getHeaders(options?.headers) });
  };

  const legacySubscribe: SubscribeFunction = function subscribe<TData, TVariables extends Record<string, unknown> = {}>(
    document: TypedDocumentNode<TData, TVariables> | string,
    options?: SubscribeOptions<TData, TVariables>
  ) {
    return legacyTransport.subscribe(document, { ...options, headers: getHeaders(options?.headers) });
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
