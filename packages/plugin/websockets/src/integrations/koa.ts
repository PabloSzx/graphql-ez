import { CommonData, handleUpgrade } from '../core';
import { createServer } from 'http';

import type { InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleKoa(instance: NonNullable<InternalAppBuildIntegrationContext['koa']>, { path, wsTuple }: CommonData) {
  const server = createServer(instance.app.callback());

  instance.app.listen = (...args: any[]) => {
    return server.listen(...args);
  };

  const state = handleUpgrade(server, path, wsTuple);

  const oldClose = server.close;
  server.close = function (cb) {
    state.closing = true;

    oldClose.call(this, cb);

    for (const wsServer of state.wsServers) {
      for (const client of wsServer.clients) {
        client.close();
      }
      wsServer.close();
    }

    return server;
  };
}
