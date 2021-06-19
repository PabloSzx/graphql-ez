import type { RequestHandler } from '@graphql-ez/core-app';
import type { RenderOptions } from 'altair-static';

export interface AltairOptions extends RenderOptions {
  /**
   * @default "/altair"
   */
  path?: string;
}

declare module '@graphql-ez/core-types' {
  interface IDEOptions {
    altair?: AltairOptions | boolean;
  }

  interface InternalAppBuildContext {
    altair?: {
      handler: (options: AltairOptions | boolean) => RequestHandler;
      options: AltairOptions;
      path: string;
      baseURL: string;
    };
  }
}
