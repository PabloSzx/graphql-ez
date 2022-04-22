import { build } from 'esbuild';
import { join } from 'path';
import cpy from 'cpy';

async function main() {
  await build({
    entryPoints: [join(__dirname, './index.tsx')],
    bundle: true,
    outfile: join(__dirname, '../bundle/graphiql.min.js'),
    minify: true,
    define: {
      'process.env.NODE_ENV': '"production"',
      setImmediate: 'setTimeout',
      global: 'window',
    },
    target: 'es2019',
    format: 'iife',
    platform: 'browser',
  });

  await cpy('./bundle/', './src/', {
    cwd: join(__dirname, '../'),
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
