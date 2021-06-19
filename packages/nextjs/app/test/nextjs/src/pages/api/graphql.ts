import { buildApp } from '../../api/app';

const EZApp = buildApp({
  async prepare({ gql, registerModule }) {
    registerModule(
      gql`
        type Query {
          hello: String!
        }
      `,
      {
        resolvers: {
          Query: {
            hello() {
              return 'Hello World!';
            },
          },
        },
      }
    );
  },
});

export default EZApp.handler;
