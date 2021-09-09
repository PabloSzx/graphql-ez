import { registerNexus } from './ez';

registerNexus.queryType({
  definition(t) {
    t.string('hello', {
      resolve() {
        return 'Hello World';
      },
    });
  },
});
