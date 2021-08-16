export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*/*', 'internal/*', 'yoga/*'],
  },
  verbose: true,
  outputOptions: {
    sourcemap: false,
  },
};
