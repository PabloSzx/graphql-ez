import Fastify from 'fastify';
import { getGraphQLParameters, processRequest } from 'graphql-helix';
import { requireEnv } from 'require-env-variable';
import { schema } from 'benchmark-bench';

const app = Fastify({
  logger: process.env.NODE_ENV !== 'production',
});

app.post('/graphql', async (req, res) => {
  const request = {
    body: req.body,
    headers: req.headers,
    method: req.method,
    query: req.query,
  };
  const { operationName, query, variables } = getGraphQLParameters(request);
  const result = await processRequest({
    operationName,
    query,
    variables,
    request,
    schema,
  });

  if (result.type === 'RESPONSE') {
    for (const { name, value } of result.headers) {
      res.header(name, value);
    }
    res.status(result.status);
    res.send(result.payload);
  } else {
    throw Error('UNSUPPORTED!');
  }
});

app.listen({
  port: parseInt(requireEnv('PORT').PORT),
});
