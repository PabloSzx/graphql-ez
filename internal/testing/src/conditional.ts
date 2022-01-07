import { versionInfo } from 'graphql';

export const testIfStreamDefer = versionInfo.preReleaseTag?.includes('stream-defer') ? test : test.skip;

export const testIfNode16OrPlus = parseInt(process.versions.node.split('.')[0]!) >= 16 ? test : test.skip;
