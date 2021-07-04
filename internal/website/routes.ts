import { IRoutes, GenerateRoutes } from '@guild-docs/server';

export function getRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      docs: {
        $name: 'Docs',
        $routes: ['README'],
        _: {
          fastify: {
            $name: 'Fastify',
          },
          express: {
            $name: 'Express',
          },
          hapi: {
            $name: 'Hapi',
          },
          koa: {
            $name: 'Koa',
          },
          http: {
            $name: 'Node.js HTTP',
          },
          nextjs: {
            $name: 'Next.js',
          },
        },
      },
    },
  };
  GenerateRoutes({
    Routes,
    folderPattern: 'docs',
    basePath: 'docs',
    basePathLabel: 'Documentation',
  });

  return Routes;
}
