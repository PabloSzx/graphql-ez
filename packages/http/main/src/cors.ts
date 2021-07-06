import type { CorsOptions, CorsOptionsDelegate } from 'cors';
import type { IncomingMessage, ServerResponse } from 'http';

export type EZCors = boolean | CorsOptions | CorsOptionsDelegate;

type CorsMiddleware = (req: IncomingMessage, res: ServerResponse, options?: EZCors) => Promise<unknown>;

function initMiddleware(middleware: typeof import('cors'), opts: CorsOptions | CorsOptionsDelegate | undefined): CorsMiddleware {
  return (req: IncomingMessage, res: ServerResponse) =>
    new Promise<unknown>((resolve, reject) => {
      middleware(opts)(req, res, (result: Error | unknown) => {
        if (result instanceof Error) {
          return reject(result);
        }

        return resolve(result);
      });
    });
}

export function handleCors(options?: EZCors): void | Promise<CorsMiddleware> {
  if (!options) return;

  return import('cors').then(({ default: corsModule }) => {
    const opts = typeof options === 'boolean' ? undefined : options;

    return initMiddleware(corsModule, opts);
  });
}
