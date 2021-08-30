export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*/*', 'internal/*', 'yoga/*', 'benchmarks/bench'],
  },
  verbose: false,
  outputOptions: {
    sourcemap: false,
  },
};
