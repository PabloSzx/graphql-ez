import type { PickRequired } from 'graphql-ez';
import type { RenderOptions } from 'altair-static-slim';
import type { IncomingMessage, ServerResponse } from 'http';

export interface AltairOptions extends Omit<RenderOptions, 'endpointURL'> {
  /**
   * @default "/altair"
   */
  path?: string;

  /**
   * URL to set as the server endpoint
   */
  endpoint?: string;

  /**
   * Disable Altair integration based on specific request-based conditional
   */
  disableIf?: (req: IncomingMessage) => boolean;
}

export type IDEHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export type AltairRender = (options: {
  baseURL: string;
  url: string | undefined;
  altairPath: string;
  renderOptions: RenderOptions;
  raw?: boolean;
}) => Promise<{
  status: number;
  contentType?: string;
  content?: string | Buffer;
  rawContent?: ArrayBuffer;
  isBasePath: boolean;
}>;

declare module 'graphql-ez' {
  interface IDEOptions {
    altair?: AltairOptions | boolean;
  }

  interface InternalAppBuildContext {
    altair?: {
      handler: (options: PickRequired<AltairOptions, 'path'>) => IDEHandler;
      render: Promise<AltairRender>;
      options: AltairOptions;
      path: string;
      baseURL: string;
    };
  }
}
