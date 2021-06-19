import assert from 'assert';

import { cleanObject, getObjectValue } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import {
  CommonWebSocketsServerTuple,
  FilteredGraphQLWSOptions,
  FilteredSubscriptionsTransportOptions,
  GRAPHQL_TRANSPORT_WS_PROTOCOL,
  GRAPHQL_WS_PROTOCOL,
  handleGraphQLWS,
  handleSubscriptionsTransport,
  WebSocketsState,
} from './core';

import type { Envelop } from '@envelop/types';
import type WebSocket from 'ws';
import type { Server as HttpServer } from 'http';

import type { EZPlugin, InternalAppBuildContext } from '@graphql-ez/core-types';

export interface WebSocketObjectOptions {
  subscriptionsTransport?: FilteredSubscriptionsTransportOptions | boolean;
  graphQLWS?: FilteredGraphQLWSOptions | boolean;
  wsOptions?: Pick<WebSocket.ServerOptions, 'verifyClient' | 'clientTracking' | 'perMessageDeflate' | 'maxPayload'>;
}

export interface WebSocketObjectOptionsConfig {
  subscriptionsTransport?: FilteredSubscriptionsTransportOptions;
  graphQLWS?: FilteredGraphQLWSOptions;
  wsOptions?: Pick<WebSocket.ServerOptions, 'verifyClient' | 'clientTracking' | 'perMessageDeflate' | 'maxPayload'>;
}

export type WebSocketOptions = WebSocketObjectOptions | 'new' | 'legacy' | 'adaptive';

export type CommonWebSocketsServer = Promise<
  ((getEnveloped: Envelop<unknown>) => (httpServer: HttpServer, path: string) => WebSocketsState) | null
>;

export type WebSocketsEnabledState = 'new' | 'adaptive' | 'legacy';

declare module '@graphql-ez/core-types' {
  interface BuildContextArgs {
    ws?: {
      socket: WebSocket;
      connectionParams: Readonly<Record<string, unknown>> | undefined;
    };
  }

  interface AppOptions {
    path?: string;
  }

  interface InternalAppBuildContext {
    ws?: {
      enabled: WebSocketsEnabledState;
      options: WebSocketObjectOptionsConfig;
      wsServer: WebSocket.Server | [graphqlWsServer: WebSocket.Server, subWsServer: WebSocket.Server];
      wsTuple?: CommonWebSocketsServerTuple;
    };
  }
}

const WSDeps = {
  ws: LazyPromise(() => import('ws').then(v => v.default)),
  subscriptionsTransportWs: LazyPromise(() =>
    import('subscriptions-transport-ws-envelop/server').then(v => v.SubscriptionServer)
  ),
  useGraphQLWSServer: LazyPromise(() => import('graphql-ws/lib/use/ws').then(v => v.useServer)),
};

export const WebSocketsEZPlugin = (options: WebSocketOptions = 'adaptive'): EZPlugin => {
  return {
    async onRegister(ctx) {
      const enableOldTransport =
        options === 'legacy' || options === 'both' || (typeof options === 'object' && options.subscriptionsTransport);

      const enableGraphQLWS = options === true || options === 'adaptive' || (typeof options === 'object' && options.graphQLWS);

      const enableAll = enableOldTransport && enableGraphQLWS;

      const enabled: WebSocketsEnabledState | 'none' = enableAll
        ? 'adaptive'
        : enableOldTransport
        ? 'legacy'
        : enableGraphQLWS
        ? 'new'
        : 'none';

      if (enabled === 'none') {
        console.warn('No Websockets implementations enabled!');
        return;
      }

      const optionsObj: WebSocketObjectOptionsConfig =
        typeof options === 'object'
          ? {
              subscriptionsTransport: getObjectValue(options.subscriptionsTransport),
              graphQLWS: getObjectValue(options.graphQLWS),
              wsOptions: options.wsOptions,
            }
          : {};

      const ws = await WSDeps.ws;

      const wsServer: NonNullable<InternalAppBuildContext['ws']>['wsServer'] = enableAll
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

      ctx.ws = {
        enabled,
        options: optionsObj,
        wsServer: wsServer,
      };
    },
    async onAfterBuild(getEnveloped, ctx) {
      if (!ctx.ws) return;

      const {
        options: { buildContext },
        ws: { enabled, wsServer, options },
      } = ctx;

      const { useGraphQLWSServer, subscriptionsTransportWs } = WSDeps;
      let wsTuple: CommonWebSocketsServerTuple;

      if (enabled === 'new') {
        assert(!Array.isArray(wsServer));
        assert(useGraphQLWSServer);

        handleGraphQLWS(await useGraphQLWSServer, wsServer, options.graphQLWS, getEnveloped, buildContext);

        wsTuple = ['new', wsServer];
      } else if (enabled === 'adaptive') {
        assert(subscriptionsTransportWs);
        assert(useGraphQLWSServer);
        assert(Array.isArray(wsServer));

        handleGraphQLWS(await useGraphQLWSServer, wsServer[0], options.graphQLWS, getEnveloped, buildContext);

        handleSubscriptionsTransport(
          await subscriptionsTransportWs,
          wsServer[1],
          options.subscriptionsTransport,
          getEnveloped,
          buildContext
        );

        wsTuple = [
          'both',
          (protocol: string | string[] | undefined) => {
            const protocols = Array.isArray(protocol) ? protocol : protocol?.split(',').map(p => p.trim());

            return protocols?.includes(GRAPHQL_WS_PROTOCOL) && !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL)
              ? wsServer[1]
              : wsServer[0];
          },
          wsServer,
        ];
      } else {
        assert(subscriptionsTransportWs);
        assert(!Array.isArray(wsServer));

        handleSubscriptionsTransport(
          await subscriptionsTransportWs,
          wsServer,
          options.subscriptionsTransport,
          getEnveloped,
          buildContext
        );

        wsTuple = ['legacy', wsServer];
      }

      ctx.ws.wsTuple = wsTuple;
    },
    async onIntegrationRegister(ctx, integrationCtx) {
      if (!ctx.ws || !ctx.ws.wsTuple) return;

      const {
        ws: { wsTuple },
        options: { path },
      } = ctx;

      assert(path, `"path" not specified!`);

      if (integrationCtx.fastify) {
        const { handleFastify } = await import('./fastify');

        handleFastify(integrationCtx.fastify, {
          path,
          wsTuple,
        });
      }
    },
  };
};

export * from './core';
