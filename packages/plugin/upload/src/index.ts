import { gql } from '@graphql-ez/utils/gql';
import { getObjectValue } from '@graphql-ez/utils/object';
import { LazyPromise } from '@graphql-ez/utils/promise';
import type { RequestHandler } from 'express';
import type { EZPlugin } from 'graphql-ez';
import type { GraphQLUpload, graphqlUploadExpress, graphqlUploadKoa, processRequest, UploadOptions } from 'graphql-upload';

export type GraphQLUploadConfig = boolean | UploadOptions;

export { readStreamToBuffer } from '@graphql-ez/utils/buffer';

declare module 'graphql-ez' {
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
    compatibilityList: {
      fastify: true,
      koa: true,
      express: true,
    },
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
    async onIntegrationRegister(ctx) {
      if (!ctx.GraphQLUpload) return;

      const GraphQLUpload = ctx.GraphQLUpload;

      return {
        async fastify({ integration }) {
          const processRequest = await GraphQLUpload.processRequest;

          integration.addContentTypeParser('multipart', (req, _payload, done) => {
            req.isMultipart = true;
            done(null);
          });

          integration.addHook('preValidation', async function (request, reply) {
            if (!request.isMultipart) return;

            request.body = await processRequest(request.raw, reply.raw, ctx.GraphQLUpload?.options);
          });
        },
        async express({ integration: { router } }) {
          if (!ctx.options.path) throw Error("Path not specified and it's required for GraphQL Upload");

          const graphqlUploadExpress: RequestHandler<any, any, any, any, any> = (await GraphQLUpload.express)(
            GraphQLUpload.options
          );

          router.post(ctx.options.path, graphqlUploadExpress, (_req, _res, next) => next());
        },
        async koa({ integration: { router } }) {
          if (!ctx.options.path) throw Error("Path not specified and it's required for GraphQL Upload");

          const koaMiddleware = (await GraphQLUpload.koa)(GraphQLUpload.options);

          router.post(ctx.options.path, koaMiddleware);
        },
      };
    },
  };
};
