// Inspired by https://github.com/gajus/graphql-deduplicator/blob/master/src/deflate.js

type NodeType = object | { _id?: string; id?: string | number; __typename?: string } | ReadonlyArray<NodeType>;

const deflateFn = (node: NodeType, index: Record<string, any>, path: ReadonlyArray<string>): NodeType => {
  if (Array.isArray(node)) {
    return node.map(childNode => {
      if (typeof childNode === 'string' || typeof childNode === 'number' || typeof childNode === 'boolean') {
        return childNode;
      } else {
        return deflateFn(childNode, index, path);
      }
    });
  } else {
    if (node && '__typename' in node && (node.id || node._id) && node.__typename) {
      const id = (node.id || node._id)!;

      const route = path.join(',');

      if (index[route] && index[route][node.__typename] && index[route][node.__typename][id]) {
        return {
          __typename: node.__typename,
          id: node.id,
        };
      } else {
        if (!index[route]) {
          index[route] = {};
        }

        if (!index[route][node.__typename]) {
          index[route][node.__typename] = {};
        }

        index[route][node.__typename][id] = true;
      }
    }
    const result: Record<string, unknown> = {};
    for (const [fieldName, value] of Object.entries(node)) {
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        result[fieldName] = deflateFn(value, index, path.concat([fieldName]));
      } else {
        result[fieldName] = value;
      }
    }

    return result;
  }
};

export const deflate = (response: object) => {
  return deflateFn(response, {}, []);
};
