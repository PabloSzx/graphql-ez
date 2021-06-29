import type { PickRequired } from 'graphql-ez';
import type { RenderOptions } from 'altair-static';
import type { IncomingMessage, ServerResponse } from 'http';

export interface AltairOptions extends RenderOptions {
  /**
   * @default "/altair"
   */
  path?: string;
}

export type IDEHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<
  | {
      content: Buffer | string;
      contentType: string;
    }
  | undefined
>;

export interface HandlerConfig {
  /**
   * @default true
   */
  rawHttp?: boolean;
}

declare module 'graphql-ez' {
  interface IDEOptions {
    altair?: AltairOptions | boolean;
  }

  interface InternalAppBuildContext {
    altair?: {
      handler: (options: PickRequired<AltairOptions, 'path'>, extraConfig?: HandlerConfig) => IDEHandler;
      options: AltairOptions;
      path: string;
      baseURL: string;
    };
  }
}
