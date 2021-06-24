export const TearDownPromises: Promise<unknown>[] = [];

afterAll(async () => {
  await Promise.all(TearDownPromises);
});
