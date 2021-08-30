import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte',

    adapter: adapter({
      // default options are shown
      out: 'build',
      precompress: false,
      env: {
        host: 'HOST',
        port: 'PORT',
      },
    }),
  },
};

export default config;
