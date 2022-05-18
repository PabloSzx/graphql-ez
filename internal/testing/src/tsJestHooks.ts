const metaImportUrlRegex = /import\.meta\.url/g;

export const depsJsImport = /deps\.js/g;

export function afterProcess(
  []: [fileContent: string, filePath: string, jestConfig: unknown, transformOptions: unknown],
  { code }: { code: string }
) {
  return {
    code: code.replace(metaImportUrlRegex, 'new URL("file:" + __filename)').replace(depsJsImport, 'deps'),
  };
}
