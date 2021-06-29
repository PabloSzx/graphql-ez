const concurrently = require('concurrently');

module.exports = async () => {
  await concurrently(['pnpm -r test:build'], {
    raw: true,
  });
};
