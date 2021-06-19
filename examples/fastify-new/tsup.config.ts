export const tsup: import('tsup').Options = {
  entryPoints: ['src/index.ts'],
  format: ['esm'],
  target: 'es2019',
};
