import Fastify from 'fastify';
import { buildApp } from './ez';

const app = Fastify({
  logger: true,
});

app.register(buildApp().fastifyPlugin);

app.listen(8072);
