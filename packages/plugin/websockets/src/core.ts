import { cleanObject } from '@graphql-ez/utils/object';
import { getPathname } from '@graphql-ez/utils/url';

import type WebSocket from 'ws';
import type { IncomingMessage, Server as HttpServer } from 'http';
import type { Socket } from 'net';
import type { ServerOptions as SubscriptionsTransportOptions } from 'subscriptions-transport-ws-envelop/server';
import type { ServerOptions as GraphQLWSOptions } from 'graphql-ws';
import type { ExecutionArgs } from 'graphql';
import type { AppOptions, GetEnvelopedFn } from 'graphql-ez';

export type FilteredSubscriptionsTransportOptions = Omit<
  SubscriptionsTransportOptions,
  'schema' | 'execute' | 'subscribe' | 'onConnect' | 'validate' | 'parse'
>;

export type FilteredGraphQLWSOptions = Omit<GraphQLWSOptions, 'schema' | 'execute' | 'subscribe' | 'context' | 'validate'>;

export interface WebSocketsState {
  closing: boolean;
  wsServers: readonly WebSocket.Server[];
}

export interface CommonData {
  path: string;
  wsTuple: CommonWebSocketsServerTuple;
}

export type CommonWebSocketsServerTuple =
  | readonly ['new', WebSocket.Server]
  | readonly [
      'both',
      (protocol: string | string[] | undefined) => WebSocket.Server,
      readonly [WebSocket.Server, WebSocket.Server],
    ]
  | readonly ['legacy', WebSocket.Server];

export function handleSubscriptionsTransport(
  subscriptionsTransportWs: typeof import('subscriptions-transport-ws-envelop/server').SubscriptionServer,
  wsServer: WebSocket.Server,
  options: FilteredSubscriptionsTransportOptions | undefined,
  getEnveloped: GetEnvelopedFn<unknown>,
  buildContext: AppOptions['buildContext']
): void {
  const { execute, subscribe } = getEnveloped();
  subscriptionsTransportWs.create(
    {
      ...cleanObject(options),
      execute,
      subscribe,
      async onConnect(connectionParams, { socket, request }) {
        const contextArgsData = {
          req: request,
          ws: {
            connectionParams,
            socket,
          },
        };
        const { contextFactory, parse, validate, schema } = getEnveloped(
          buildContext ? Object.assign(contextArgsData, await buildContext(contextArgsData)) : contextArgsData
        );

        return {
          contextValue: await contextFactory(),
          parse,
          validate,
          schema,
        };
      },
    },
    wsServer
  );
}

export function handleGraphQLWS(
  useGraphQLWSServer: typeof import('graphql-ws/dist/use/ws').useServer,
  wsServer: WebSocket.Server,
  options: FilteredGraphQLWSOptions | undefined,
  getEnveloped: GetEnvelopedFn<unknown>,
  buildContext: AppOptions['buildContext']
): void {
  const { execute, subscribe } = getEnveloped();
  useGraphQLWSServer(
    {
      ...cleanObject(options),
      execute,
      subscribe,
      async onSubscribe(context, id, payload) {
        const {
          connectionParams,
          extra: { request, socket },
        } = context;
        const { operationName, query, variables } = payload;

        options?.onSubscribe;

        if (typeof options?.onSubscribe === 'function') {
          options.onSubscribe(context, id, payload);
        }

        const contextArgsData = {
          req: request,
          ws: {
            connectionParams,
            socket,
          },
        };
        const { schema, contextFactory, parse, validate } = getEnveloped(
          Object.assign(contextArgsData, buildContext ? await buildContext(contextArgsData) : undefined)
        );
        const args: ExecutionArgs = {
          schema,
          operationName: operationName,
          document: parse(query),
          variableValues: variables,
          contextValue: await contextFactory(),
        };

        const errors = validate(schema, args.document);
        if (errors.length) return errors;

        return args;
      },
    },
    wsServer
  );
}

export function handleUpgrade(httpServer: HttpServer, path: string, wsTuple: CommonWebSocketsServerTuple): WebSocketsState {
  const wsServers = wsTuple[0] === 'both' ? wsTuple[2] : ([wsTuple[1]] as const);

  const state: WebSocketsState = {
    closing: false,
    wsServers,
  };

  function closeSocket(rawRequest: IncomingMessage, socket: Socket, head: Buffer, code: number) {
    return (wsServers[1] || wsServers[0]).handleUpgrade(rawRequest, socket, head, webSocket => {
      webSocket.close(code);
    });
  }

  httpServer.on('upgrade', (rawRequest: IncomingMessage, socket: Socket, head: Buffer) => {
    const requestUrl = getPathname(rawRequest.url);

    if (state.closing || requestUrl !== path) {
      return closeSocket(rawRequest, socket, head, 1001);
    }

    const protocol = rawRequest.headers['sec-websocket-protocol'];

    switch (wsTuple[0]) {
      case 'both': {
        const server = wsTuple[1](protocol);

        return server.handleUpgrade(rawRequest, socket, head, ws => {
          server.emit('connection', ws, rawRequest);
        });
      }
      case 'new': {
        const server = wsTuple[1];

        return server.handleUpgrade(rawRequest, socket, head, ws => {
          server.emit('connection', ws, rawRequest);
        });
      }
      case 'legacy': {
        const server = wsTuple[1];

        return server.handleUpgrade(rawRequest, socket, head, ws => {
          server.emit('connection', ws, rawRequest);
        });
      }
    }
  });

  return state;
}

export const NEW_PROTOCOL = 'graphql-transport-ws';
export const LEGACY_PROTOCOL = 'graphql-ws';
