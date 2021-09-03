import { printSchema } from 'graphql';

import { deepStrictEqual, strictEqual } from 'assert';
import {
  CommonSchema,
  PingSubscription,
  startTinyhttpServer,
  expectCommonQueryStream,
  expectCommonServerSideEventSubscription,
} from 'graphql-ez-testing';
import * as tinyEz from '../src/index';

it('basic', async () => {
  const { query, addressWithoutProtocol, ezApp } = await startTinyhttpServer(
    {
      createOptions: {
        schema: CommonSchema.schema,
        cors: true,
        async buildContext(args) {
          return {
            foo: 'bar',
            ip: args.tinyhttp?.req.ip,
          };
        },
      },
    },
    tinyEz
  );

  deepStrictEqual(
    JSON.parse(
      (
        await query<{
          context: string;
        }>(`{context}`)
      ).data!.context.replace(new RegExp(addressWithoutProtocol, 'g'), '__host__')
    ),
    {
      document: {
        definitions: [
          {
            directives: [],
            kind: 'OperationDefinition',
            loc: {
              end: 9,
              start: 0,
            },
            operation: 'query',
            selectionSet: {
              kind: 'SelectionSet',
              loc: {
                end: 9,
                start: 0,
              },
              selections: [
                {
                  arguments: [],
                  directives: [],
                  kind: 'Field',
                  loc: {
                    end: 8,
                    start: 1,
                  },
                  name: {
                    kind: 'Name',
                    loc: {
                      end: 8,
                      start: 1,
                    },
                    value: 'context',
                  },
                },
              ],
            },
            variableDefinitions: [],
          },
        ],
        kind: 'Document',
        loc: {
          end: 9,
          start: 0,
        },
      },
      foo: 'bar',
      operation: {
        directives: [],
        kind: 'OperationDefinition',
        loc: {
          end: 9,
          start: 0,
        },
        operation: 'query',
        selectionSet: {
          kind: 'SelectionSet',
          loc: {
            end: 9,
            start: 0,
          },
          selections: [
            {
              arguments: [],
              directives: [],
              kind: 'Field',
              loc: {
                end: 8,
                start: 1,
              },
              name: {
                kind: 'Name',
                loc: {
                  end: 8,
                  start: 1,
                },
                value: 'context',
              },
            },
          ],
        },
        variableDefinitions: [],
      },
      request: {
        body: {
          query: '{context}',
        },
        headers: {
          connection: 'keep-alive',
          'content-length': '21',
          'content-type': 'application/json',
          host: '__host__',
        },
        method: 'POST',
        query: {
          '/graphql': '',
        },
      },
    }
  );

  strictEqual(
    printSchema(ezApp.getEnveloped().schema).trim(),
    `
type Query {
  hello: String!
  users: [User!]!
  stream: [String!]!
  context: String!
}

type User {
  id: Int!
}
     
  `.trim()
  );
});

it('query with @stream', async () => {
  const { address } = await startTinyhttpServer(
    {
      createOptions: {
        schema: [CommonSchema.schema],
      },
    },
    tinyEz
  );

  await expectCommonQueryStream(address);
});

it('SSE subscription', async () => {
  const { address } = await startTinyhttpServer(
    {
      createOptions: {
        schema: [CommonSchema.schema, PingSubscription.schema],
      },
    },
    tinyEz
  );

  await expectCommonServerSideEventSubscription(address);
});
