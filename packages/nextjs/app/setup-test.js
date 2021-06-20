const { resolve } = require('path');
const { execSync } = require('child_process');
const { makeExecutableSchema } = require('@graphql-tools/schema');

module.exports = async () => {
  const { EnvelopTypeScriptCodegen, gql } = require('@graphql-ez/core');

  await EnvelopTypeScriptCodegen(
    makeExecutableSchema({
      typeDefs: gql`
        type Query {
          hello: String!
          users: [User!]!
          getContext: JSONObject!
          stream: [String!]!
        }
        type Mutation {
          uploadFileToBase64(file: Upload!): String!
        }
        type Subscription {
          ping: String!
        }
        type User {
          id: Int!
        }
        scalar JSONObject
        scalar Upload
      `,
    }),
    {
      enableCodegen: true,
      codegen: {
        preImportCode: `\n/* istanbul ignore file */\n\n`,
        targetPath: resolve(__dirname, `./test/generated/envelop.generated.ts`),
        documents: resolve(__dirname, './test/graphql/*.gql'),
        transformGenerated(code) {
          return code;
        },
        scalars: {
          Upload: "Promise<import('graphql-upload').FileUpload>",
        },
      },
    },
    {
      moduleName: 'core',
    }
  );

  execSync(`node ${require.resolve('next/dist/bin/next')} build ${resolve(__dirname, 'test/nextjs')}`, {
    stdio: 'inherit',
  });
};
