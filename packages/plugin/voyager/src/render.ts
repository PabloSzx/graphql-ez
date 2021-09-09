const version = '1.0.0-rc.31';

export interface VoyagerDisplayOptions {
  rootType?: string;
  skipRelay?: boolean;
  skipDeprecated?: boolean;
  showLeafFields?: boolean;
  sortByAlphabet?: boolean;
  hideRoot?: boolean;
}

export interface RenderVoyagerOptions {
  endpoint?: string;

  headers?: string | Record<string, unknown>;

  displayOptions?: VoyagerDisplayOptions;

  credentials?: 'same-origin' | 'include' | 'omit';
}

export function renderVoyagerPage(options: RenderVoyagerOptions) {
  const { endpoint, headers = '{}', displayOptions, credentials } = options;

  const headersString = headers
    ? typeof headers === 'object'
      ? JSON.stringify(headers)
      : typeof headers === 'string'
      ? headers
      : '{}'
    : '{}';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset=utf-8 />
    <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0">
    <title>GraphQL Voyager</title>
    <style>
      body {
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100vh;
        overflow: hidden;
      }
      #voyager {
        height: 100vh;
      }
    </style>
    <link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/graphql-voyager@${version}/dist/voyager.css"
    />
    <link rel="shortcut icon" href="https://i.imgur.com/SEC809s.png" />
    <script src="https://cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/graphql-voyager@${version}/dist/voyager.min.js"></script>
  </head>
  <body>
    <main id="voyager">
      <h1 style="text-align: center; color: #5d7e86;"> Loading... </h1>
    </main>
    <script>
window.addEventListener('load', function(event) {
  function introspectionProvider(introspectionQuery) {
    return fetch('${endpoint}', {
      method: 'post',
      headers: Object.assign({}, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }, ${headersString}),
      body: JSON.stringify({query: introspectionQuery}),${credentials ? `\n      credentials: "${credentials}",` : ''}
    }).then(function (response) {
      return response.text();
    }).then(function (responseBody) {
      try {
        return JSON.parse(responseBody);
      } catch (error) {
        return responseBody;
      }
    });
  }

  GraphQLVoyager.init(document.getElementById('voyager'), {
    introspection: introspectionProvider,
    displayOptions: ${JSON.stringify(displayOptions)},
  })
})
    </script>
  </body>
  </html>
  `;
}
