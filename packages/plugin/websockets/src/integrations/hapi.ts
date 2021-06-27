import { CommonData, handleUpgrade } from '../core';

import type { InternalAppBuildIntegrationContext } from 'graphql-ez';

export function handleHapi(instance: NonNullable<InternalAppBuildIntegrationContext['hapi']>, { path, wsTuple }: CommonData) {
  const state = handleUpgrade(instance.server.listener, path, wsTuple);

  instance.server.events.on('stop', () => {
    state.closing = true;

    for (const wsServer of state.wsServers) {
      for (const client of wsServer.clients) {
        client.close();
      }
    }
  });
}
