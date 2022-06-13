import Fastify from 'fastify';
import { ezApp } from './ez';

const app = Fastify({
  logger: true,
});

app.register(ezApp.buildApp().fastifyPlugin);

app.listen({
  port: 4040,
  host: '0.0.0.0',
});
