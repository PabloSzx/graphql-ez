import type { ReadStream } from 'fs';

export interface FileUpload {
  createReadStream(): ReadStream;
}

export async function readStreamToBuffer(
  rsLike: ReadStream | Promise<ReadStream> | Promise<FileUpload> | FileUpload
): Promise<Buffer> {
  const readStream = await rsLike;

  const rs = 'createReadStream' in readStream ? readStream.createReadStream() : readStream;

  const chunks: Uint8Array[] = [];
  for await (const chunk of rs) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
