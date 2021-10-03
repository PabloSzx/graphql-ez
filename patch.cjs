const { writeFileSync, readFileSync } = require('fs');

// This patch is due to changeset not respecting the convention of 0.x being major releases before 1.0

// Some info related to this https://docs.npmjs.com/cli/v7/using-npm/semver#caret-ranges-123-025-004

writeFileSync(
  require.resolve('@changesets/assemble-release-plan/dist/assemble-release-plan.cjs.dev.js'),
  readFileSync('patches/assemble-release-plan.cjs.dev.js', {
    encoding: 'utf-8',
  }),
  {
    encoding: 'utf-8',
  }
);

// This patch is due to TypeGraphQL validating the GraphQL Version, and the experimental version is required

writeFileSync(
  'examples/fastify/type-graphql/node_modules/type-graphql/dist/utils/graphql-version.js',
  `
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ensureInstalledCorrectGraphQLPackage = exports.getPeerDependencyGraphQLRequirement = exports.getInstalledGraphQLVersion = void 0;
  const semVer = require("semver");
  const errors_1 = require("../errors");
  function getInstalledGraphQLVersion() {
      const graphqlPackageJson = require("graphql/package.json");
      return graphqlPackageJson.version;
  }
  exports.getInstalledGraphQLVersion = getInstalledGraphQLVersion;
  function getPeerDependencyGraphQLRequirement() {
      const ownPackageJson = require("../../package.json");
      return ownPackageJson.peerDependencies.graphql;
  }
  exports.getPeerDependencyGraphQLRequirement = getPeerDependencyGraphQLRequirement;
  function ensureInstalledCorrectGraphQLPackage() {
      const installedVersion = getInstalledGraphQLVersion();
      const versionRequirement = getPeerDependencyGraphQLRequirement();
      if (!semVer.satisfies(installedVersion, versionRequirement)) {
          // throw new errors_1.UnmetGraphQLPeerDependencyError();
      }
  }
  exports.ensureInstalledCorrectGraphQLPackage = ensureInstalledCorrectGraphQLPackage;

  `,
  {
    encoding: 'utf-8',
  }
);
