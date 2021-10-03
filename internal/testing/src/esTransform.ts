import { Loader, transform, TransformOptions, transformSync } from 'esbuild';
import path from 'path';

const loaders: Loader[] = ['js', 'jsx', 'ts', 'tsx'];

exports.processAsync = async (code: string, file: string) => {
  const extname = path.extname(file);
  const loader = loaders.find(x => `.${x}` === extname);
  const options: TransformOptions = {
    target: `node13.2`,
    format: 'esm',
    loader: loader || 'js',
    sourcemap: 'inline',
    sourcefile: file,
  };

  return (await transform(code, options)).code;
};

exports.process = (code: string, file: string) => {
  const extname = path.extname(file);
  const loader = loaders.find(x => `.${x}` === extname);
  const options: TransformOptions = {
    target: `node13.2`,
    format: 'esm',
    loader: loader || 'js',
    sourcemap: 'inline',
    sourcefile: file,
  };
  return transformSync(code, options).code;
};
