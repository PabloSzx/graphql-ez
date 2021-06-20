import { gql } from '@graphql-ez/core-utils/gql';
import { getObjectValue } from '@graphql-ez/core-utils/object';
import { LazyPromise } from '@graphql-ez/core-utils/promise';

import type { EZPlugin } from '@graphql-ez/core-types';
import type { UploadOptions, processRequest, graphqlUploadExpress, graphqlUploadKoa, GraphQLUpload } from 'graphql-upload';

export type GraphQLUploadConfig = boolean | UploadOptions;

declare module '@graphql-ez/core-types' {
  interface InternalAppBuildContext {
    GraphQLUpload?: {
      options: UploadOptions;
      processRequest: Promise<typeof processRequest>;
      express: Promise<typeof graphqlUploadExpress>;
      koa: Promise<typeof graphqlUploadKoa>;
      scalar: Promise<typeof GraphQLUpload>;
    };
  }
}

export const ezUpload = (options: GraphQLUploadConfig = true): EZPlugin => {
  return {
    name: 'GraphQL Upload',
    compatibilityList: ['fastify-new', 'koa-new'],
    onRegister(ctx) {
      if (options) {
        const deps = {
          processRequest: LazyPromise(() => import('graphql-upload/public/processRequest.js').then(v => v.default)),
          express: LazyPromise(() => import('graphql-upload/public/graphqlUploadExpress.js')).then(v => v.default),
          koa: LazyPromise(() => import('graphql-upload/public/graphqlUploadKoa.js').then(v => v.default)),
          scalar: LazyPromise(() => import('graphql-upload/public/GraphQLUpload.js').then(v => v.default)),
        };

        ctx.GraphQLUpload = {
          options: getObjectValue(options) || {},
          ...deps,
        };

        (ctx.extraSchemaDefinitions ||= []).push(
          LazyPromise(async () => {
            return {
              id: 'GraphQL Upload',
              typeDefs: gql('scalar Upload'),
              resolvers: {
                Upload: await deps.scalar,
              },
            };
          })
        );
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
