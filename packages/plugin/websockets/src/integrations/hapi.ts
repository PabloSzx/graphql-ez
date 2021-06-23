import { CommonData, handleUpgrade } from '../core';

import type { InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleHapi(instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>, { path, wsTuple }: CommonData) {
  const state = handleUpgrade(instance.server.listener, path, wsTuple);

  const oldClose = instance.server.listener.close;

  instance.server.listener.close = function (cb) {
    state.closing = true;

    oldClose.call(this, cb);

    for (const wsServer of state.wsServers) {
      for (const client of wsServer.clients) {
        client.close();
      }
    }

    return instance.server.listener;
  };
}
