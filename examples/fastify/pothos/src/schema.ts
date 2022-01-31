import SchemaBuilder from '@pothos/core';

const builder = new SchemaBuilder({});

builder.queryType({
  fields(t) {
    return {
      hello: t.string({
        resolve() {
          return 'Hello World';
        },
      }),
    };
  },
});

export const schema = builder.toSchema({});
