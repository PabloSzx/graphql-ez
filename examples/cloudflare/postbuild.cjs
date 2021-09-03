const fs = require('fs');
const path = require('path');
const clipboardy = require('clipboardy');

clipboardy.writeSync(
  fs.readFileSync(path.resolve(__dirname, './dist/worker.js'), {
    encoding: 'utf-8',
  })
);
console.log(
  '\n\nWorker code copied to clipboard, paste the bundle in your cloudflare worker dashboard https://dash.cloudflare.com/'
);
