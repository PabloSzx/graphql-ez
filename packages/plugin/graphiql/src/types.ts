import type { RenderGraphiQLOptions } from '@pablosz/graphql-helix-graphiql/static';
import type { IncomingMessage, ServerResponse } from 'http';

export interface GraphiQLOptions extends RenderGraphiQLOptions {
  /**
   * By default it's the same as the main API path, normally `"/graphql"` or `"/api/graphql"`
   */
  path?: string;
  /**
   * The endpoint requests should be sent.
   *
   * @default "/graphql"
   */
  endpoint?: string;
}

export type { RenderGraphiQLOptions };

export type IDEHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

declare module 'graphql-ez' {
  interface InternalAppBuildContext {
    graphiql?: {
      path: string;
      handler: (options: GraphiQLOptions) => IDEHandler;
      html: Promise<string>;
      options: GraphiQLOptions;
    };
  }
}
