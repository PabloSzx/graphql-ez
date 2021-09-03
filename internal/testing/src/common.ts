export const TearDownPromises: Promise<unknown>[] = [];

if (typeof afterAll !== 'undefined') {
  afterAll(async () => {
    await Promise.all(TearDownPromises);
  });
} else if (typeof after !== 'undefined') {
  after(async () => {
    await Promise.all(TearDownPromises);
  });
}
