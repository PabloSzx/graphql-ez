import { concurrently, benchAllEZFastify } from './apis';

(async () => {
  await concurrently(['rimraf raw_results && pnpm build'], {
    raw: true,
  });

  await benchAllEZFastify();

  await concurrently(['pnpm results'], {
    raw: true,
  });
})().catch(console.error);
