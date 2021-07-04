import express from 'express';

import { buildApp } from './app';

const app = express();

buildApp({
  app,
  async prepare() {
    await import('./modules');
  },
}).then(EZApp => {
  app.use(EZApp.router);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express Listening on port ${port}!`);
  });
});
