import { concurrently, benchCache, benchJit, benchJitCache, benchVanilla } from './apis';

(async () => {
  await concurrently(['rimraf raw_results && pnpm build'], {
    raw: true,
  });

  await benchCache();

  await benchJit();

  await benchJitCache();

  await benchVanilla();

  await concurrently(['pnpm results'], {
    raw: true,
  });
})().catch(console.error);
