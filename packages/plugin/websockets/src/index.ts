import assert from 'assert';

import { cleanObject, getObjectValue } from 'graphql-ez/utils/object';
import { LazyPromise } from 'graphql-ez/utils/promise';

import {
  CommonWebSocketsServerTuple,
  FilteredGraphQLWSOptions,
  FilteredSubscriptionsTransportOptions,
  NEW_PROTOCOL,
  LEGACY_PROTOCOL,
  handleGraphQLWS,
  handleSubscriptionsTransport,
  WebSocketsState,
  CommonData,
} from './core';

import type WebSocket from 'ws';
import type { Server as HttpServer } from 'http';

import type { EZPlugin, InternalAppBuildContext, GetEnvelopedFn } from 'graphql-ez';

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
  ((getEnveloped: GetEnvelopedFn<unknown>) => (httpServer: HttpServer, path: string) => WebSocketsState) | null
>;

export type WebSocketsEnabledState = 'new' | 'adaptive' | 'legacy';

declare module 'graphql-ez' {
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

/**
 * ### WebSockets plugin
 *
 * By default the configuration is set to `"adaptive"`,
 * which automatically uses `graphql-ws` or `subscriptions-transport-ws` depending on usage
 */
export const ezWebSockets = (options: WebSocketOptions = 'adaptive'): EZPlugin => {
  return {
    name: 'GraphQL WebSockets',
    async onRegister(ctx) {
      const enableOldTransport =
        options === 'legacy' || options === 'adaptive' || (typeof options === 'object' && options.subscriptionsTransport);

      const enableGraphQLWS = options === 'new' || options === 'adaptive' || (typeof options === 'object' && options.graphQLWS);

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
    onPreBuild(ctx) {
      if (!ctx.ws) return;

      if (ctx.altair) {
        if (!ctx.altair.options.initialSubscriptionsProvider) {
          switch (ctx.ws.enabled) {
            case 'new':
            case 'adaptive': {
              ctx.altair.options.initialSubscriptionsProvider = 'graphql-ws';
              break;
            }
            case 'legacy': {
              ctx.altair.options.initialSubscriptionsProvider = 'websocket';
              break;
            }
          }
        }
      }

      if (ctx.graphiql) {
        if (!ctx.graphiql.options.subscriptionsProtocol) {
          switch (ctx.ws.enabled) {
            case 'new':
            case 'adaptive': {
              ctx.graphiql.options.subscriptionsProtocol = 'WS';
              break;
            }
            case 'legacy': {
              ctx.graphiql.options.subscriptionsProtocol = 'LEGACY_WS';
              break;
            }
          }
        }
      }
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

        handleGraphQLWS(await useGraphQLWSServer, wsServer, options.graphQLWS, getEnveloped, buildContext);

        wsTuple = ['new', wsServer];
      } else if (enabled === 'adaptive') {
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

            const isLegacy = protocols?.includes(LEGACY_PROTOCOL) && !protocols.includes(NEW_PROTOCOL);

            return isLegacy ? wsServer[1] : wsServer[0];
          },
          wsServer,
        ];
      } else {
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
    compatibilityList: ['fastify', 'express', 'hapi', 'koa', 'http'],
    async onIntegrationRegister(ctx, integrationCtx) {
      if (!ctx.ws || !ctx.ws.wsTuple) return;

      const {
        ws: { wsTuple },
        options: { path },
      } = ctx;

      assert(path, '"path" not specified and is required for WebSockets EZ Plugin!');

      const commonData: CommonData = {
        wsTuple,
        path,
      };

      if (integrationCtx.fastify) {
        const { handleFastify } = await import('./integrations/fastify');

        return handleFastify(integrationCtx.fastify, commonData);
      }

      if (integrationCtx.express) {
        const { handleExpress } = await import('./integrations/express');

        return handleExpress(integrationCtx.express, commonData);
      }

      if (integrationCtx.hapi) {
        const { handleHapi } = await import('./integrations/hapi');

        return handleHapi(integrationCtx.hapi, commonData);
      }

      if (integrationCtx.koa) {
        const { handleKoa } = await import('./integrations/koa');

        return handleKoa(integrationCtx.koa, commonData);
      }

      if (integrationCtx.http) {
        const { handleHttp } = await import('./integrations/http');

        return handleHttp(integrationCtx.http, commonData);
      }
    },
  };
};

export * from './core';
