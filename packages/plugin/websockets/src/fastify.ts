import { CommonData, handleUpgrade } from './core';

import type { InternalAppBuildIntegrationContext } from '@graphql-ez/core-app';

export function handleFastify(
  instance: NonNullable<InternalAppBuildIntegrationContext['fastify']>,
  { path, wsTuple }: CommonData
) {
  const state = handleUpgrade(instance.server, path, wsTuple);

  instance.addHook('onClose', function (_fastify, done) {
    Promise.all(state.wsServers.map(server => new Promise<Error | undefined>(resolve => server.close(err => resolve(err))))).then(
      () => done(),
      done
    );
  });

  const oldClose = instance.server.close;

  // Monkeypatching fastify.server.close as done already in https://github.com/fastify/fastify-websocket/blob/master/index.js#L134
  instance.server.close = function (cb) {
    state.closing = true;

    oldClose.call(this, cb);

    for (const wsServer of state.wsServers) {
      for (const client of wsServer.clients) {
        client.close();
      }
    }

    return instance.server;
  };
}
