import { resolveConfigFile, type BuiltInParserName } from 'prettier';

export async function formatPrettier(str: string, parser: BuiltInParserName): Promise<string> {
  const prettier = await import('prettier');

  const { resolveConfig = prettier.default.resolveConfig, format = prettier.default.format } = prettier;

  const configFilePath = await resolveConfigFile();

  const resolvedConfig = await resolveConfig(configFilePath || process.cwd());

  const prettierConfig = Object.assign({}, resolvedConfig);

  return format(str, {
    parser,
    ...prettierConfig,
  });
}
