#!/usr/bin/env node

/**
 * Renames legacy XOD project/patch files to their SolderPop equivalents:
 *   project.xod  -> project.sdp
 *   patch.xodp   -> patch.sdpp
 *
 * File contents are untouched -- only the filenames change. sdp-fs still
 * reads the old names too (see LEGACY_PROJECT_FILENAMES/
 * LEGACY_PATCH_FILENAMES in packages/sdp-fs/src/constants.js), so this
 * is a one-way upgrade, not a requirement: existing projects keep working
 * either way, this just moves them onto the current canonical names.
 *
 * Usage:
 *   node tools/convert-xodp-to-sdpp.js <path> [<path> ...]
 *
 * Each <path> is a project or workspace directory (or a single project.xod
 * / patch.xodp file) to convert in place, recursively. Skips node_modules
 * and .git wherever it finds them.
 */

import fs from 'fs';
import path from 'path';

const RENAMES = {
  'project.xod': 'project.sdp',
  'patch.xodp': 'patch.sdpp',
};

const SKIP_DIRNAMES = new Set(['node_modules', '.git']);

const renameFile = (dir, oldName) => {
  const oldPath = path.join(dir, oldName);
  const newPath = path.join(dir, RENAMES[oldName]);
  fs.renameSync(oldPath, newPath);
  return [oldPath, newPath];
};

const convertDir = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || RENAMES[entry.name])
    .flatMap((entry) => {
      if (entry.isDirectory()) {
        return SKIP_DIRNAMES.has(entry.name)
          ? []
          : convertDir(path.join(dir, entry.name));
      }
      return [renameFile(dir, entry.name)];
    });

const convertPath = (targetPath) => {
  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) return convertDir(targetPath);

  const basename = path.basename(targetPath);
  if (!RENAMES[basename]) {
    throw new Error(`Not a project.xod or patch.xodp file: ${targetPath}`);
  }
  return [renameFile(path.dirname(targetPath), basename)];
};

const targets = process.argv.slice(2);
if (targets.length === 0) {
  process.stderr.write(
    'Usage: node tools/convert-xodp-to-sdpp.js <path> [<path> ...]\n'
  );
  process.exit(1);
}

const renamed = targets.flatMap((target) => convertPath(path.resolve(target)));

renamed.forEach(([from, to]) => process.stdout.write(`${from} -> ${to}\n`));
process.stdout.write(`\n${renamed.length} file(s) renamed.\n`);
