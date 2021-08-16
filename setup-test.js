const { cpus } = require('os');
const concurrently = require('concurrently');

module.exports = async () => {
  const command = `pnpm -r test:build --no-sort --workspace-concurrency ${Math.max(1, cpus().length - 1)}\n`;
  console.log('$ ' + command);
  await concurrently([command], {
    raw: true,
  });
};
