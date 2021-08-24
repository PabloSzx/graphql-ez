import {
  ExecutionContext,
  getGraphQLParameters,
  MultipartResponse,
  processRequest,
  ProcessRequestResult,
  Push,
} from '@pablosz/graphql-helix';
import type { IncomingMessage, ServerResponse } from 'http';
import type { BuildContextArgs, EZContext, EZResponse, HandleRequestOptions, Request, PreProcessRequestOptions } from './index';

export interface HelixContext extends Omit<ExecutionContext, 'request'> {
  request: Request;
}

declare module './index' {
  interface EZContext extends Partial<HelixContext> {}
}

export async function handleRequest<TReturn = unknown>({
  request,
  getEnveloped,
  contextArgs,
  buildContext,
  onResponse,
  onMultiPartResponse,
  onPushResponse,
  baseOptions,
  processRequestOptions,
  req,
  preProcessRequest,
}: HandleRequestOptions<BuildContextArgs, TReturn>): Promise<TReturn> {
  const { parse, validate, contextFactory, execute, schema, subscribe } = getEnveloped(
    Object.assign({ req }, buildContext ? await buildContext(contextArgs()) : undefined)
  );

  if (Array.isArray(request.body)) {
    const allowBatchedQueries = baseOptions.allowBatchedQueries;

    if (!allowBatchedQueries) throw Error('Batched queries not enabled!');

    if (typeof allowBatchedQueries === 'number' && request.body.length > allowBatchedQueries) {
      throw Error('Batched queries limit exceeded!');
    }

    const HeadersMap: Record<string, string> = {};

    const payload = await Promise.all(
      request.body.map(async body => {
        const { operationName, query, variables, extensions } = getGraphQLParameters({ ...request, body });

        const options: PreProcessRequestOptions<any> = {
          operationName,
          query,
          variables,
          request,
          schema,
          parse,
          validate,
          contextFactory,
          execute,
          subscribe,
          extensions,
        };

        if (processRequestOptions) {
          Object.assign(options, processRequestOptions());
        }

        let result: ProcessRequestResult<EZContext, unknown> | undefined;

        if (preProcessRequest) {
          for (const handler of preProcessRequest) {
            const handlerResult = await handler({
              appOptions: baseOptions,
              requestOptions: options,
            });
            if (handlerResult) {
              result = handlerResult;
              break;
            }
          }
          if (!result) result = await processRequest(options);
        } else {
          result = await processRequest(options);
        }

        if (result.type !== 'RESPONSE') throw Error(`Unsupported ${result.type} in Batched Queries!`);

        for (const { name, value } of result.headers) {
          HeadersMap[name] = value;
        }

        return result.payload;
      })
    );

    return onResponse(
      {
        type: 'RESPONSE',
        status: 200,
        payload,
        headers: Object.entries(HeadersMap).map(([name, value]) => ({ name, value })),
      },
      defaultResponseHandle
    );
  }

  const { operationName, query, variables, extensions } = getGraphQLParameters(request);

  const options: PreProcessRequestOptions<any> = {
    operationName,
    query,
    variables,
    request,
    schema,
    parse,
    validate,
    contextFactory,
    execute,
    subscribe,
    extensions,
  };

  if (processRequestOptions) {
    Object.assign(options, processRequestOptions());
  }

  let result: ProcessRequestResult<EZContext, unknown> | undefined;

  if (preProcessRequest) {
    for (const handler of preProcessRequest) {
      const handlerResult = await handler({
        appOptions: baseOptions,
        requestOptions: options,
      });
      if (handlerResult) {
        result = handlerResult;
        break;
      }
    }
    if (!result) result = await processRequest(options);
  } else {
    result = await processRequest(options);
  }

  switch (result.type) {
    case 'RESPONSE': {
      return onResponse(result, defaultResponseHandle);
    }
    case 'MULTIPART_RESPONSE': {
      return onMultiPartResponse(result, defaultMultipartResponseHandle);
    }
    case 'PUSH': {
      return onPushResponse(result, defaultPushResponseHandle);
    }
  }
}

export function defaultResponseHandle(_req: IncomingMessage, res: ServerResponse, result: EZResponse): void {
  res.writeHead(result.status, {
    'content-type': 'application/json',
  });

  for (const { name, value } of result.headers) {
    res.setHeader(name, value);
  }

  res.end(JSON.stringify(result.payload));
}

export async function defaultMultipartResponseHandle(
  req: IncomingMessage,
  res: ServerResponse,
  result: MultipartResponse<unknown, unknown>
): Promise<void> {
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'multipart/mixed; boundary="-"',
    'Transfer-Encoding': 'chunked',
    'Content-Encoding': 'none',
  });

  req.socket.on('close', () => {
    result.unsubscribe();
  });

  res.write('---');

  await result.subscribe(result => {
    const chunk = Buffer.from(JSON.stringify(result), 'utf8');
    const data = ['', 'Content-Type: application/json; charset=utf-8', 'Content-Length: ' + String(chunk.length), '', chunk];

    if (result.hasNext) {
      data.push('---');
    }

    res.write(data.join('\r\n'));
  });

  res.write('\r\n-----\r\n');
  res.end();
}

export async function defaultPushResponseHandle(
  req: IncomingMessage,
  res: ServerResponse,
  result: Push<unknown, unknown>
): Promise<void> {
  res.writeHead(200, {
    'Content-Encoding': 'none',
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  });

  req.socket.on('close', () => {
    result.unsubscribe();
  });

  await result.subscribe(result => {
    res.write(`data: ${JSON.stringify(result)}\n\n`);
  });
}
