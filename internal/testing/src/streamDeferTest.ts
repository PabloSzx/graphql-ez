import { versionInfo } from 'graphql';

export const testIfStreamDefer = versionInfo.preReleaseTag?.includes('stream-defer') ? test : test.skip;
