import concurrently from 'concurrently';

export function startBench(env: NodeJS.ProcessEnv) {
  return concurrently(
    [
      {
        command: 'wait-on tcp:4000 -s 1 && cross-env PORT=4000 node -r esbuild-register src/bench.ts && kill-port 4000',
        env,
      },
    ],
    {
      raw: true,
    }
  ).catch(err => {
    console.error(err);
  });
}

export function api(cwd: string, env: NodeJS.ProcessEnv) {
  return concurrently(
    [
      {
        command: 'pnpm start',
        env: {
          PORT: '4000',
          ...env,
        },
      },
    ],
    {
      cwd,
      raw: true,
    }
  ).catch(err => {
    console.error(err);
  });
}

export function benchEZFastify(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-fastify', env),
    startBench({
      TITLE: 'EZ Fastify',
      ...env,
    }),
  ]);
}

export function benchEZExpress(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-express', env),
    startBench({
      TITLE: 'EZ Express',
      ...env,
    }),
  ]);
}

export function benchEZHapi(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-hapi', env),
    startBench({
      TITLE: 'EZ Hapi',
      ...env,
    }),
  ]);
}

export function benchEZHTTP(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-http', env),
    startBench({
      TITLE: 'EZ Node.js HTTP',
      ...env,
    }),
  ]);
}

export function benchEZKoa(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/ez-koa', env),
    startBench({
      TITLE: 'EZ Koa',
      ...env,
    }),
  ]);
}

export function benchMercurius(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/mercurius', env),
    startBench({
      TITLE: 'Mercurius',
      ...env,
    }),
  ]);
}

export function benchRawEnvelop(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/envelop-fastify-raw', env),
    startBench({
      TITLE: 'Envelop Fastify Raw',
      ...env,
    }),
  ]);
}

export function benchGraphQLHelix(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/graphql-helix', env),
    startBench({
      TITLE: 'GraphQLHelix',
      ...env,
    }),
  ]);
}

export function benchExpressGraphQL(env: NodeJS.ProcessEnv) {
  return Promise.all([
    api('../apis/express-graphql', env),
    startBench({
      TITLE: 'express-graphql',
      ...env,
    }),
  ]);
}

export async function benchCache() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'Cache',
    CACHE: 'true',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
}

export async function benchJit() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'Jit',
    JIT: 'true',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
}

export async function benchJitCache() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'JitCache',
    JIT: 'true',
    CACHE: 'true',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
}

export async function benchVanilla() {
  const env: NodeJS.ProcessEnv = {
    SUBTITLE: 'Vanilla',
  };
  await benchEZFastify(env);
  await benchEZExpress(env);
  await benchEZHapi(env);
  await benchEZHTTP(env);
  await benchEZKoa(env);
  await benchMercurius(env);
  await benchRawEnvelop(env);
  await benchGraphQLHelix(env);
  await benchExpressGraphQL(env);
}

export async function benchAllEZFastify() {
  const env1: NodeJS.ProcessEnv = {
    SUBTITLE: 'Cache',
    CACHE: 'true',
  };
  await benchEZFastify(env1);

  const env2: NodeJS.ProcessEnv = {
    SUBTITLE: 'Jit',
    JIT: 'true',
  };
  await benchEZFastify(env2);

  const env3: NodeJS.ProcessEnv = {
    SUBTITLE: 'JitCache',
    JIT: 'true',
    CACHE: 'true',
  };
  await benchEZFastify(env3);

  const env4: NodeJS.ProcessEnv = {
    SUBTITLE: 'Vanilla',
  };
  await benchEZFastify(env4);
}

export { concurrently };
