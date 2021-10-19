const metaImportUrlRegex = /import\.meta\.url/g;

export function afterProcess(
  []: [fileContent: string, filePath: string, jestConfig: unknown, transformOptions: unknown],
  result: string
) {
  return result.replace(metaImportUrlRegex, 'new URL("file:" + __filename)');
}
