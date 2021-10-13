import clipboardy from 'clipboardy';
import fs from 'fs';
import path from 'path';
import url from 'url';

clipboardy.writeSync(
  fs.readFileSync(path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), './dist/worker.js'), {
    encoding: 'utf-8',
  })
);
console.log(
  '\n\nWorker code copied to clipboard, paste the bundle in your cloudflare worker dashboard https://dash.cloudflare.com/'
);
