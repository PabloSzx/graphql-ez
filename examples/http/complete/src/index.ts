import { createServer } from 'http';

import { buildApp } from './app';

const server = createServer((req, res) => {
  EZApp.requestHandler(req, res);
});

const EZApp = buildApp({
  server,
  async prepare() {
    await import('./modules');
  },
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`HTTP Listening on port ${port}!`);
});
