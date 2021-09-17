import Fastify from 'fastify';
import { ezApp } from './ez';

const app = Fastify({
  logger: true,
});

app.register(ezApp.buildApp().fastifyPlugin);

app.listen(4040, '0.0.0.0');
