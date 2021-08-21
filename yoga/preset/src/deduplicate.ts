import { EZContext, handleStreamOrSingleExecutionResult, Plugin as EnvelopPlugin } from 'graphql-ez';

import { deflate } from '@graphql-ez/utils/deflate';

export const useDeduplicate = ({
  expectedHeader = 'x-graphql-deduplicate',
}: {
  /**
   * @default 'x-graphql-deduplicate'
   */
  expectedHeader?: string;
} = {}): EnvelopPlugin<EZContext> => {
  expectedHeader = expectedHeader.toLowerCase();
  return {
    onExecute({ args: { contextValue } }) {
      if (!contextValue.req.headers[expectedHeader]) return;

      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(payload, ({ result, setResult }) => {
            if (result.data && !result.data.__schema) {
              setResult({
                ...result,
                data: deflate(result.data),
              });
            }
          });
        },
      };
    },
  };
};
