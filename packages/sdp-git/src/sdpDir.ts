import path from 'node:path';
import fs from 'fs-extra';

/** IDE-local state dir; ignores itself so it never shows up as a change. */
export const ensureSdpDir = async (
  projectDir: string,
  ...subdirs: string[]
) => {
  const sdpDir = path.join(projectDir, '.sdp');
  const dir = path.join(sdpDir, ...subdirs);
  await fs.ensureDir(dir);

  const gitignore = path.join(sdpDir, '.gitignore');
  if (!(await fs.pathExists(gitignore))) {
    await fs.writeFile(gitignore, '*\n');
  }
  return dir;
};
