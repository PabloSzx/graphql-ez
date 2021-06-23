const { execSync } = require('child_process');

module.exports = async () => {
  execSync(`node ${require.resolve('next/dist/bin/next')} build "test/main"`, {
    stdio: 'inherit',
  });
};
