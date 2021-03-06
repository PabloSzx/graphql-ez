import { versionInfo } from 'graphql';

export const testIfStreamDefer = versionInfo.preReleaseTag?.includes('stream-defer') ? test : test.skip;

export const isNode16Plus = parseInt(process.versions.node.split('.')[0]!) >= 16;
export const testIfNode16OrPlus = isNode16Plus ? test : test.skip;
