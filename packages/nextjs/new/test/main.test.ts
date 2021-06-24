import EventSource from 'eventsource';
import got from 'got';
import { printSchema } from 'graphql';

import { CommonSchema, startNextJSServer } from '@graphql-ez/testing';

export { EventSource, got, printSchema, CommonSchema };

test.concurrent('basic', async () => {
  const { query, addressWithoutProtocol } = await startNextJSServer('test/main');

  expect(
    JSON.parse(
      (
        (
          await query<{
            context: string;
          }>(`{context}`)
        ).data?.context || '{}'
      ).replace(new RegExp(addressWithoutProtocol, 'g'), '__host__')
    )
  ).toMatchInlineSnapshot(`
    Object {
      "document": Object {
        "definitions": Array [
          Object {
            "directives": Array [],
            "kind": "OperationDefinition",
            "loc": Object {
              "end": 9,
              "start": 0,
            },
            "operation": "query",
            "selectionSet": Object {
              "kind": "SelectionSet",
              "loc": Object {
                "end": 9,
                "start": 0,
              },
              "selections": Array [
                Object {
                  "arguments": Array [],
                  "directives": Array [],
                  "kind": "Field",
                  "loc": Object {
                    "end": 8,
                    "start": 1,
                  },
                  "name": Object {
                    "kind": "Name",
                    "loc": Object {
                      "end": 8,
                      "start": 1,
                    },
                    "value": "context",
                  },
                },
              ],
            },
            "variableDefinitions": Array [],
          },
        ],
        "kind": "Document",
        "loc": Object {
          "end": 9,
          "start": 0,
        },
      },
      "foo": "bar",
      "operation": Object {
        "directives": Array [],
        "kind": "OperationDefinition",
        "loc": Object {
          "end": 9,
          "start": 0,
        },
        "operation": "query",
        "selectionSet": Object {
          "kind": "SelectionSet",
          "loc": Object {
            "end": 9,
            "start": 0,
          },
          "selections": Array [
            Object {
              "arguments": Array [],
              "directives": Array [],
              "kind": "Field",
              "loc": Object {
                "end": 8,
                "start": 1,
              },
              "name": Object {
                "kind": "Name",
                "loc": Object {
                  "end": 8,
                  "start": 1,
                },
                "value": "context",
              },
            },
          ],
        },
        "variableDefinitions": Array [],
      },
      "request": Object {
        "body": Object {
          "query": "{context}",
        },
        "headers": Object {
          "connection": "keep-alive",
          "content-length": "21",
          "content-type": "application/json",
          "host": "__host__",
        },
        "method": "POST",
        "query": Object {},
      },
    }
  `);
});
