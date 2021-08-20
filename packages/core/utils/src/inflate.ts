// Inspired by https://github.com/gajus/graphql-deduplicator/blob/master/src/inflate.js

type NodeType = object | { _id?: string; id?: string | number; __typename?: string } | ReadonlyArray<NodeType>;

const inflateFn = (node: NodeType, index: Record<string, any>, path: ReadonlyArray<string>): NodeType => {
  if (Array.isArray(node)) {
    return node.map(childNode => {
      if (typeof childNode === 'string' || typeof childNode === 'number' || typeof childNode === 'boolean') {
        return childNode;
      } else {
        return inflateFn(childNode, index, path);
      }
    });
  } else {
    if (node && '__typename' in node && (node.id || node._id) && node.__typename) {
      const id = (node.id || node._id)!;
      const route = path.join(',');

      if (index[route] && index[route][node.__typename] && index[route][node.__typename][id]) {
        return index[route][node.__typename][id];
      }

      if (!index[route]) {
        index[route] = {};
      }

      if (!index[route][node.__typename]) {
        index[route][node.__typename] = {};
      }

      index[route][node.__typename][id] = node;
    }
    const result: Record<string, unknown> = {};
    for (const [fieldName, value] of Object.entries(node)) {
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        result[fieldName] = inflateFn(value, index, path.concat([fieldName]));
      } else {
        result[fieldName] = value;
      }
    }

    return result;
  }
};

export const inflate = (response: object) => {
  return inflateFn(response, {}, []);
};
