//@ts-nocheck

// TODO: Fix context initialization with envelop change

import assert from 'assert';

import { cleanObject } from '../utils/object';
import { getPathname } from '../utils/url';

import type { Envelop } from '@envelop/core';
import type WebSocket from 'ws';
import type { IncomingMessage, Server as HttpServer } from 'http';
import type { Socket } from 'net';
import type { ServerOptions as SubscriptionsTransportOptions } from 'subscriptions-transport-ws-envelop/dist/server';
import type { ServerOptions as GraphQLWSOptions } from 'graphql-ws';
import type { ExecutionArgs } from 'graphql';
import type { EnvelopContext, BuildContextArgs } from '../types';
import type { BaseEnvelopAppOptions } from '../app';

declare module '../types' {
  interface BuildContextArgs {
    ws?: {
      socket: WebSocket;
      connectionParams: Readonly<Record<string, unknown>> | undefined;
    };
  }
}

export type CommonWebSocketsServerTuple =
  | readonly ['new', WebSocket.Server]
  | readonly [
      'both',
      (protocol: string | string[] | undefined) => WebSocket.Server,
      readonly [WebSocket.Server, WebSocket.Server]
    ]
  | readonly ['legacy', WebSocket.Server];

interface WebSocketsState {
  closing: boolean;
  wsServers: readonly WebSocket.Server[];
}

function handleUpgrade(httpServer: HttpServer, path: string, wsTuple: CommonWebSocketsServerTuple): WebSocketsState {
  const wsServers = wsTuple[0] === 'both' ? wsTuple[2] : ([wsTuple[1]] as const);

  const state: WebSocketsState = {
    closing: false,
    wsServers,
  };

  httpServer.on('upgrade', (rawRequest: IncomingMessage, socket: Socket, head: Buffer) => {
    const requestUrl = getPathname(rawRequest.url);

    if (state.closing || requestUrl !== path) {
      return wsServers[0].handleUpgrade(rawRequest, socket, head, webSocket => {
        webSocket.close(1001);
      });
    }

    switch (wsTuple[0]) {
      case 'both': {
        const server = wsTuple[1](rawRequest.headers['sec-websocket-protocol']);

        return server.handleUpgrade(rawRequest, socket, head, ws => {
          server.emit('connection', ws, rawRequest);
        });
      }
      case 'new':
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

export type FilteredSubscriptionsTransportOptions = Omit<
  SubscriptionsTransportOptions,
  'schema' | 'execute' | 'subscribe' | 'onConnect' | 'validate' | 'parse'
>;

export type FilteredGraphQLWSOptions = Omit<
  GraphQLWSOptions,
  'schema' | 'execute' | 'subscribe' | 'context' | 'validate' | 'onSubscribe'
>;
export interface WebSocketObjectOptions {
  subscriptionsTransport?: FilteredSubscriptionsTransportOptions | boolean;
  graphQLWS?: FilteredGraphQLWSOptions | boolean;
  wsOptions?: Pick<WebSocket.ServerOptions, 'verifyClient' | 'clientTracking' | 'perMessageDeflate' | 'maxPayload'>;
}

export type WebSocketOptions = WebSocketObjectOptions | boolean | 'legacy' | 'both';

export type CommonWebSocketsServer = Promise<
  ((getEnveloped: Envelop<unknown>) => (httpServer: HttpServer, path: string) => WebSocketsState) | null
>;

type SubscriptionsTransportOnConnectArgs = [
  connectionParams: Record<string, unknown> | undefined,
  socket: WebSocket,
  connectionContext: {
    request: IncomingMessage;
  }
];

export interface WithWebSockets {
  /**
   * Websocket configuration
   */
  websockets?: WebSocketOptions;
}

export const CreateWebSocketsServer = async (
  config: BaseEnvelopAppOptions<EnvelopContext> & WithWebSockets
): CommonWebSocketsServer => {
  const options = config.websockets;

  const enableOldTransport =
    options === 'legacy' || options === 'both' || (typeof options === 'object' && options.subscriptionsTransport);

  const enableGraphQLWS = options === true || options === 'both' || (typeof options === 'object' && options.graphQLWS);

  const enableAll = enableOldTransport && enableGraphQLWS;

  const enabled: 'new' | 'both' | 'legacy' | 'none' = enableAll
    ? 'both'
    : enableOldTransport
    ? 'legacy'
    : enableGraphQLWS
    ? 'new'
    : 'none';

  if (enabled === 'none') return null;

  const optionsObj =
    typeof options === 'object'
      ? {
          subscriptionsTransport: typeof options.subscriptionsTransport === 'object' ? options.subscriptionsTransport : {},
          graphQLWS: typeof options.graphQLWS === 'object' ? options.graphQLWS : {},
          wsOptions: options.wsOptions,
        }
      : {};

  const GRAPHQL_TRANSPORT_WS_PROTOCOL = 'graphql-transport-ws';
  const GRAPHQL_WS = 'graphql-ws';

  const [ws, subscriptionsTransportWs, useGraphQLWSServer] = await Promise.all([
    import('ws').then(v => v.default),
    enableOldTransport ? import('subscriptions-transport-ws-envelop/dist/server.js').then(v => v.SubscriptionServer) : null,
    enableGraphQLWS ? import('graphql-ws/lib/use/ws').then(v => v.useServer) : null,
  ]);

  const wsServer: WebSocket.Server | [graphqlWsServer: WebSocket.Server, subWsServer: WebSocket.Server] = enableAll
    ? [
        /**
         * graphql-ws
         */
        new ws.Server({
          ...cleanObject(optionsObj.wsOptions),
          noServer: true,
        }),
        /**
         * subscriptions-transport-ws
         */
        new ws.Server({
          ...cleanObject(optionsObj.wsOptions),
          noServer: true,
        }),
      ]
    : new ws.Server({
        ...cleanObject(optionsObj.wsOptions),
        noServer: true,
      });

  const { buildContext } = config;

  return function (getEnveloped) {
    const { contextFactory } = getEnveloped();

    async function getContext(contextArgs: BuildContextArgs) {
      if (buildContext) return contextFactory(Object.assign({}, await buildContext(contextArgs)));

      return contextFactory(contextArgs);
    }

    let wsTuple: CommonWebSocketsServerTuple;

    if (enabled === 'new') {
      assert(!Array.isArray(wsServer));
      assert(useGraphQLWSServer);

      handleGraphQLWS(useGraphQLWSServer, wsServer, optionsObj.graphQLWS, getEnveloped, getContext);

      wsTuple = ['new', wsServer];
    } else if (enabled === 'both') {
      assert(subscriptionsTransportWs);
      assert(useGraphQLWSServer);
      assert(Array.isArray(wsServer));

      handleGraphQLWS(useGraphQLWSServer, wsServer[0], optionsObj.graphQLWS, getEnveloped, getContext);

      handleSubscriptionsTransport(
        subscriptionsTransportWs,
        wsServer[1],
        optionsObj.subscriptionsTransport,
        getEnveloped,
        getContext
      );

      wsTuple = [
        'both',
        (protocol: string | string[] | undefined) => {
          const protocols = Array.isArray(protocol) ? protocol : protocol?.split(',').map(p => p.trim());

          return protocols?.includes(GRAPHQL_WS) && !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL)
            ? wsServer[1]
            : wsServer[0];
        },
        wsServer,
      ];
    } else {
      assert(subscriptionsTransportWs);
      assert(!Array.isArray(wsServer));

      handleSubscriptionsTransport(
        subscriptionsTransportWs,
        wsServer,
        optionsObj.subscriptionsTransport,
        getEnveloped,
        getContext
      );

      wsTuple = ['legacy', wsServer];
    }

    return function (httpServer, path) {
      return handleUpgrade(httpServer, path, wsTuple);
    };
  };
};

export function handleSubscriptionsTransport(
  subscriptionsTransportWs: typeof import('subscriptions-transport-ws-envelop/dist/server.js').SubscriptionServer,
  wsServer: WebSocket.Server,
  options: FilteredSubscriptionsTransportOptions | undefined,
  getEnveloped: Envelop<unknown>,
  getContext: (contextArgs: BuildContextArgs) => Promise<unknown>
): void {
  const { schema, execute, subscribe, validate, parse } = getEnveloped();
  subscriptionsTransportWs.create(
    {
      ...cleanObject(options),
      schema,
      // @ts-expect-error Incompatibilities due to experimental versions of GraphQL
      execute,
      subscribe,
      validate,
      parse,
      onConnect(...[connectionParams, socket, { request }]: SubscriptionsTransportOnConnectArgs) {
        return getContext({
          req: request,
          ws: {
            connectionParams,
            socket,
          },
        });
      },
    },
    wsServer
  );
}

export function handleGraphQLWS(
  useGraphQLWSServer: typeof import('graphql-ws/lib/use/ws').useServer,
  wsServer: WebSocket.Server,
  options: FilteredGraphQLWSOptions | undefined,
  getEnveloped: Envelop<unknown>,
  getContext: (contextArgs: BuildContextArgs) => Promise<unknown>
): void {
  const { execute, subscribe, parse, validate } = getEnveloped();
  useGraphQLWSServer(
    {
      ...cleanObject(options),
      execute,
      subscribe,
      async onSubscribe({ connectionParams, extra: { request, socket } }, { payload: { operationName, query, variables } }) {
        const { schema } = getEnveloped();
        const args: ExecutionArgs = {
          schema,
          operationName: operationName,
          document: parse(query),
          variableValues: variables,
          contextValue: await getContext({
            req: request,
            ws: {
              connectionParams,
              socket,
            },
          }),
        };

        const errors = validate(schema, args.document);
        if (errors.length) return errors;

        return args;
      },
    },
    wsServer
  );
}
