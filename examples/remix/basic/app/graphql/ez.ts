import { CreateApp } from '@graphql-ez/remix';
import { schema } from './schema';

export const ezApp = CreateApp({
  schema,
});

export const { action, loader } = ezApp.buildApp();
