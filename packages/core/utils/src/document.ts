import { DocumentNode, Kind } from 'graphql';

export function isDocumentNode(object: unknown): object is DocumentNode {
  //@ts-expect-error
  return !!object && typeof object === 'object' && 'kind' in object && object.kind === Kind.DOCUMENT;
}
