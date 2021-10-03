import { dirname } from 'path';
import { fileURLToPath } from 'url';

export function getDirname(importUrl: string) {
  return dirname(fileURLToPath(importUrl));
}
