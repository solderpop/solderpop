import fs from 'fs';
import path from 'path';
import yauzl from 'yauzl';

// TODO: Add unpack functions for other archives

// A Unix symlink's st_mode high bits, as stored in a zip entry's
// externalFileAttributes by tools that made the zip on a Unix system.
const S_IFLNK = 0xa000;
const isSymlinkEntry = (entry) =>
  // eslint-disable-next-line no-bitwise -- unpacking a packed mode field
  ((entry.externalFileAttributes >>> 16) & 0xf000) === S_IFLNK;

const isWithinDir = (dir, entryPath) =>
  entryPath === dir || entryPath.startsWith(dir + path.sep);

const openEntryReadStream = (zipfile, entry) =>
  new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (err, readStream) => {
      if (err) reject(err);
      else resolve(readStream);
    });
  });

const writeEntryToDisk = async (readStream, entryPath) => {
  await fs.promises.mkdir(path.dirname(entryPath), { recursive: true });
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(entryPath);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    readStream.on('error', reject);
    readStream.pipe(writeStream);
  });
};

// Extracts a single validated zip entry (directory or file) to disk.
const extractEntry = async (zipfile, dir, entry) => {
  const entryPath = path.resolve(dir, entry.fileName);
  if (!isWithinDir(dir, entryPath)) {
    throw new Error(`Zip entry escapes target directory: ${entry.fileName}`);
  }
  if (isSymlinkEntry(entry)) {
    throw new Error(
      `Zip entry is a symlink, refusing to extract: ${entry.fileName}`
    );
  }

  if (/\/$/.test(entry.fileName)) {
    await fs.promises.mkdir(entryPath, { recursive: true });
    return;
  }

  const readStream = await openEntryReadStream(zipfile, entry);
  await writeEntryToDisk(readStream, entryPath);
};

/**
 * Unpacks zip in the same directory.
 * Returns `Promise` with the name of the unpacked root directory.
 * E.G.
 * 1. We downloaded "my-lib.zip".
 *    And it has an "awe$ome-library" directory in the root.
 * 2. Called `unpackZip('/my/path/my-lib.zip')`.
 *    It unpacked archive into `/my/path/awe$ome-library/`.
 *    And returned Promise with `awe$some-library/`.
 * 3. Then we can do something with this directory on next steps.
 *    E.G. rename to the normalized name.
 *
 * Zip entries are extracted directly (not via `extract-zip`, which has an
 * unpatched symlink path-traversal CVE -- GHSA-jmr9-qjv8-65gv). Entries
 * that would resolve outside `dir`, and symlink entries, are rejected
 * rather than followed; these zips come from library downloads, not code
 * we control.
 *
 * :: Path -> Promise Path Error
 */
export default (filePath) =>
  new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    let originalRootDirName = null;

    yauzl.open(filePath, { lazyEntries: true }, (openErr, zipfile) => {
      if (openErr) {
        reject(openErr);
        return;
      }

      zipfile.on('error', reject);
      zipfile.on('end', () => resolve(originalRootDirName));
      zipfile.on('entry', (entry) => {
        if (!originalRootDirName) {
          originalRootDirName = path.basename(entry.fileName);
        }

        extractEntry(zipfile, dir, entry)
          .then(() => zipfile.readEntry())
          .catch(reject);
      });

      zipfile.readEntry();
    });
  });
