export interface FileUpload {
  createReadStream(): AsyncIterable<Uint8Array>;
}

export async function readStreamToBuffer(
  rsLike: AsyncIterable<Uint8Array> | Promise<AsyncIterable<Uint8Array>> | Promise<FileUpload> | FileUpload
): Promise<Buffer> {
  const readStream = await rsLike;

  const rs = 'createReadStream' in readStream ? readStream.createReadStream() : readStream;

  const chunks: Uint8Array[] = [];
  for await (const chunk of rs) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
