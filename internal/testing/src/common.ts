export const TearDownPromises: Promise<unknown>[] = [];

typeof afterAll !== 'undefined' &&
  afterAll(async () => {
    Promise.allSettled(TearDownPromises);
  });
