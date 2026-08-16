import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createWorkingDirectory = prefix =>
  fs.mkdtempSync(path.resolve(os.tmpdir(), `sdp-cli-test-${prefix}-`));

export const bundledWorkspacePath = path.resolve(
  __dirname,
  '..',
  'bundle',
  'workspace'
);

export const getFilesFromPath = (p, extension) => {
  const dir = fs.readdirSync(p);
  return dir.filter(el => el.match(new RegExp(`.*.(${extension})$`, 'ig')));
};
