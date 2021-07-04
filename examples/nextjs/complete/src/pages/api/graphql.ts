import { buildApp } from '../../api/app';

const EZApp = buildApp({
  async prepare() {
    await import('../../api/modules');
  },
});

export default EZApp.apiHandler;
