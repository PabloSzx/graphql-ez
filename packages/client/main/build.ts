import { buildTsc } from 'bob-esbuild';
import { writePackageJson } from 'bob-esbuild/config/packageJson';
import { buildCode } from 'bob-ts';
import { build } from 'esbuild';
import { promises } from 'fs';
import rimraf from 'rimraf';
import pkg from './package.json';

async function main() {
  await new Promise(resolve => rimraf('dist', resolve));

  const tscPromise = Promise.allSettled([buildTsc()]).then(v => v[0]);

  await promises.mkdir('dist', {
    recursive: true,
  });

  await Promise.all([
    build({
      bundle: true,
      format: 'cjs',
      target: 'node12.20',
      entryPoints: ['./src/deps.ts'],
      outfile: 'dist/deps.js',
      platform: 'node',
      minify: true,
      external: ['graphql'],
    }),
    promises.copyFile('LICENSE', 'dist/LICENSE'),
    promises.copyFile('README.md', 'dist/README.md'),
    writePackageJson({
      packageJson: pkg,
      distDir: 'dist',
    }),
  ]);

  await Promise.all([
    buildCode({
      entryPoints: ['./src/index.ts', './src/types.ts'],
      clean: false,
      format: 'interop',
      outDir: 'dist',
      target: 'node12.20',
      esbuild: {
        minify: false,
      },
      sourcemap: false,
      external: ['./deps.js'],
      keepDynamicImport: false,
      rollup: {
        interop: 'esModule',
      },
    }),
  ]);

  await tscPromise.then(v => {
    if (v.status === 'rejected') throw v.reason;
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
