import { LazyPromise } from '@graphql-ez/utils/promise';

const deps = LazyPromise(async () => {
  const [
    mkdirp,
    { dirname },
    {
      existsSync,
      promises: { readFile, writeFile },
    },
  ] = await Promise.all([import('mkdirp').then(v => v.default), import('path'), import('fs')]);

  return {
    mkdirp,
    dirname,
    existsSync,
    readFile,
    writeFile,
  };
});

/**
 * Write the target file only if the content changed
 */
export async function writeFileIfChanged(targetPath: string, content: string): Promise<void> {
  const { mkdirp, dirname, existsSync, readFile, writeFile } = await deps;
  const fileExists = existsSync(targetPath);

  if (fileExists) {
    const existingContent = await readFile(targetPath, {
      encoding: 'utf-8',
    });

    if (existingContent === content) return;
  }

  await mkdirp(dirname(targetPath));

  await writeFile(targetPath, content, {
    encoding: 'utf-8',
  });
}
