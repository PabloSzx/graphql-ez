import { CommonData, handleUpgrade } from '../core';

import type { InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleHttp(instance: NonNullable<InternalAppBuildIntegrationContext['http']>, { path, wsTuple }: CommonData) {
  const server = instance.server;

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
