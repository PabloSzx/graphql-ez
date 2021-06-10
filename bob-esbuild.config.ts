export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*', 'internal/*'],
  },
  verbose: true,
};
