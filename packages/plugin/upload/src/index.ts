import { LazyPromise } from '@graphql-ez/core-utils/promise';
import { gql } from '@graphql-ez/core-utils/gql';

import type { EZPlugin } from '@graphql-ez/core-types';
import type { UploadOptions, processRequest, graphqlUploadExpress, graphqlUploadKoa, GraphQLUpload } from 'graphql-upload';
import type { DocumentNode, GraphQLScalarType } from 'graphql';

export type GraphQLUploadConfig = boolean | UploadOptions;

declare module '@graphql-ez/core-types' {
  interface InternalAppBuildContext {
    GraphQLUpload?: {
      options: UploadOptions;
      processRequest: Promise<typeof processRequest>;
      express: Promise<typeof graphqlUploadExpress>;
      koa: Promise<typeof graphqlUploadKoa>;
      scalar: Promise<typeof GraphQLUpload>;
      definition: Promise<{
        typeDefs: DocumentNode;
        resolvers: { Upload: GraphQLScalarType };
      }>;
    };
  }
}

export const UploadEZPlugin = (options: GraphQLUploadConfig = true): EZPlugin => {
  return {
    onRegister(ctx) {
      if (options) {
        const deps = {
          processRequest: LazyPromise(() => import('graphql-upload/public/processRequest.js')),
          express: LazyPromise(() => import('graphql-upload/public/graphqlUploadExpress.js')),
          koa: LazyPromise(() => import('graphql-upload/public/graphqlUploadKoa.js')),
          scalar: LazyPromise(() => import('graphql-upload/public/GraphQLUpload.js')),
        };
        const definition = LazyPromise(async () => {
          return {
            typeDefs: gql('scalar Upload'),
            resolvers: {
              Upload: await deps.scalar,
            },
          };
        });

        ctx.GraphQLUpload = {
          options: typeof options === 'object' ? options : {},
          ...deps,
          definition,
        };

        (ctx.extraSchemaDefinitions ||= []).push(definition);
      }
    },
    async onIntegrationRegister(ctx, integrationCtx) {
      if (!ctx.GraphQLUpload) return;

      if (integrationCtx.fastify) {
        const instance = integrationCtx.fastify;
        const processRequest = await ctx.GraphQLUpload.processRequest;

        instance.addContentTypeParser('multipart', (req, _payload, done) => {
          req.isMultipart = true;
          done(null);
        });

        instance.addHook('preValidation', async function (request, reply) {
          if (!request.isMultipart) return;

          request.body = await processRequest(request.raw, reply.raw, ctx.GraphQLUpload?.options);
        });
      }
    },
  };
};
