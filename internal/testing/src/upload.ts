import FormData from 'form-data';
import { print } from 'graphql';

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export const UploadFileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'uploadFile' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'file' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Upload' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'uploadFileToBase64' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'file' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'file' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as TypedDocumentNode<{ uploadFileToBase65: string }, { file: any }>;

export function createUploadFileBody(content: string) {
  const body = new FormData();

  const uploadFilename = 'a.png';

  const query = print(UploadFileDocument);
  const operations = {
    query,
    variables: { file: null },
  };

  body.append('operations', JSON.stringify(operations));
  body.append('map', JSON.stringify({ '1': ['variables.file'] }));
  body.append('1', content, { filename: uploadFilename });

  return body;
}
