import { getGraphQLParameters } from 'graphql-helix/dist/get-graphql-parameters.js';
import { processRequest } from 'graphql-helix/dist/process-request.js';
import type { MultipartResponse, Push } from 'graphql-helix';
import type { IncomingMessage, ServerResponse } from 'http';
import type { BuildContextArgs, HandleRequestOptions, EnvelopResponse } from '@graphql-ez/core-types';

export async function handleRequest<TReturn = unknown>({
  request,
  getEnveloped,
  buildContextArgs,
  buildContext,
  onResponse,
  onMultiPartResponse,
  onPushResponse,
  baseOptions,
}: HandleRequestOptions<BuildContextArgs, TReturn>): Promise<TReturn> {
  const { parse, validate, contextFactory, execute, schema, subscribe } = getEnveloped(buildContext?.(buildContextArgs()));

  if (Array.isArray(request.body)) {
    const allowBatchedQueries = baseOptions.allowBatchedQueries;

    if (!allowBatchedQueries) throw Error('Batched queries not enabled!');

    if (typeof allowBatchedQueries === 'number' && request.body.length > allowBatchedQueries) {
      throw Error('Batched queries limit exceeded!');
    }

    const payload = await Promise.all(
      request.body.map(async body => {
        const { operationName, query, variables } = getGraphQLParameters({ ...request, body });

        const result = await processRequest({
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
        });

        if (result.type !== 'RESPONSE') throw Error(`Unsupported ${result.type} in Batched Queries!`);

        return result.payload;
      })
    );

    return onResponse(
      {
        type: 'RESPONSE',
        status: 200,
        payload,
      },
      defaultResponseHandle
    );
  }

  const { operationName, query, variables } = getGraphQLParameters(request);

  const result = await processRequest({
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
  });

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

export function defaultResponseHandle(_req: IncomingMessage, res: ServerResponse, result: EnvelopResponse): void {
  res.writeHead(result.status, {
    'content-type': 'application/json',
  });

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
