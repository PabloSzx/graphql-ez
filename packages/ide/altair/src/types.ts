import type { RenderOptions } from 'altair-static';

export interface AltairOptions extends RenderOptions {
  /**
   * @default "/altair"
   */
  path?: string;
}
