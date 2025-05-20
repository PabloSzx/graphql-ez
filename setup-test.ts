// // const { cpus } = require('os');
// // const concurrently = require('concurrently');

// module.exports = async () => {
//   // const command = `pnpm -r test:build --no-sort --workspace-concurrency ${Math.max(1, cpus().length - 1)}\n`;
//   // console.log('$ ' + command);
//   // await concurrently([command], {
//   //   raw: true,
//   // });
// };

import { build } from 'esbuild';
import { resolve } from 'path';

export default async () => {
  const outfile = resolve(__dirname, './packages/cloudflare/main/test/worker/bundle.js');

  await build({
    entryPoints: [resolve(__dirname, './packages/cloudflare/main/test/worker/worker.ts')],
    bundle: true,
    target: 'es2019',
    outfile,
    splitting: false,
    minify: true,
    banner: {
      js: '// @ts-nocheck',
    },
  });
};
