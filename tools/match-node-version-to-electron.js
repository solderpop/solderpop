#! /usr/bin/env node

/**
 * This script ensures that `engines.node` field of `package.json`
 * and `.nvmrc` contain the exact same version of node.js
 * that ships with the current Electron version we're using.
 *
 * Should be run in CI after installing node modules
 * and before "verify-git-clean" step,
 * or manually after updating electron.
 */

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

// Reads sdp-client-electron's own installed electron -- the actual
// version this repo builds against -- rather than requiring a redundant
// root-level `electron` dependency that could drift out of sync with it.
const electronPackageJsonPath = path.resolve(
  __dirname,
  '..',
  'packages/sdp-client-electron/node_modules/electron/package.json'
);
const electronVersion = require(electronPackageJsonPath).version;

function updateEngines(nodeVersion) {
  const pathToPackageJson = path.resolve(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(pathToPackageJson));
  packageJson.engines.node = nodeVersion;
  fs.writeFileSync(
    pathToPackageJson,
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
}

function updateNvmrc(nodeVersion) {
  fs.writeFileSync(path.resolve(__dirname, '..', '.nvmrc'), `${nodeVersion}\n`);
}

fetch('https://unpkg.com/electron-releases/lite.json')
  .then((response) => response.json())
  .then((electronReleases) => {
    const release = electronReleases.find(
      ({ version }) => version === electronVersion
    );

    if (!release)
      throw new Error(`Can't find electron release ${electronVersion}`);

    const nodeVersion = release.deps.node;
    updateNvmrc(nodeVersion);
    updateEngines(nodeVersion);

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
