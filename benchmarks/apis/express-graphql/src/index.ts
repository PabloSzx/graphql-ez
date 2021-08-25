import { schema } from 'benchmark-bench';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { requireEnv } from 'require-env-variable';

const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
  })
);

app.listen(requireEnv('PORT').PORT);
