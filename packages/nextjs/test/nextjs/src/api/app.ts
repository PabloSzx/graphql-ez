import { CreateApp } from '../../../../src';

function buildContext(_args: import('../../../../src').BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

export const { buildApp, registerModule, gql } = CreateApp({
  buildContext,
  enableCodegen: false,
});
