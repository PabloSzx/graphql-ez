import { IRoutes, GenerateRoutes } from '@guild-docs/server';

export function getRoutes(): IRoutes {
  const Routes: IRoutes = {
    _: {
      docs: {
        $name: 'Docs',
        $routes: ['README'],
        _: {
          integrations: {
            $name: 'Integrations',
            $routes: ['fastify', 'express', 'hapi', 'koa', 'http', 'nextjs'],
          },
          plugins: {
            $name: 'Plugins',
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
