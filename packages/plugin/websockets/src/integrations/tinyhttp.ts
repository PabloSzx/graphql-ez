import { CommonData, handleUpgrade } from '../core';
import { createServer } from 'http';

import type { InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleTinyhttp(
  instance: NonNullable<InternalAppBuildIntegrationContext['tinyhttp']>,
  { path, wsTuple }: CommonData
) {
  const server = createServer().on('request', instance.app.attach);

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
        client.terminate();
      }
      wsServer.close();
    }

    return server;
  };
}
