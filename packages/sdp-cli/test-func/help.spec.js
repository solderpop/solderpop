import path from 'path';
import { fileURLToPath } from 'url';
import { runCommand } from '@oclif/test';
import chai from 'chai';

const { assert } = chai;

// @oclif/test's own root auto-detection walks up from require.main / the
// require.cache under Node's CJS interop, which resolves to somewhere
// under mocha's own install rather than this package when run via
// mocha+babel-register -- pass the real root explicitly instead of relying
// on it (confirmed empirically: without this, every command silently
// resolves to "command X not found" and stdout comes back empty).
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('sdpc help', () => {
  it('prints help to stdout', async () => {
    const { stdout } = await runCommand(['help'], { root });
    assert.include(stdout, 'autocomplete', 'autocomplete command not found');
    assert.include(stdout, 'boards', 'boards command not found');
    assert.include(stdout, 'compile', 'compile command not found');
    assert.include(stdout, 'help', 'help command not found');
    assert.include(stdout, 'install', 'install command not found');
    assert.include(stdout, 'publish', 'publish command not found');
    assert.include(stdout, 'resave', 'resave command not found');
    assert.include(stdout, 'tabtest', 'tabtest command not found');
    assert.include(stdout, 'transpile', 'transpile command not found');
    assert.include(stdout, 'upload', 'upload command not found');
  });

  [
    'autocomplete',
    'boards',
    'compile',
    'help',
    'install',
    'publish',
    'resave',
    'tabtest',
    'transpile',
    'upload',
  ].forEach((command) => {
    it(`prints help to stdout for command '${command}'`, async () => {
      const { stdout } = await runCommand(['help', command], { root });
      assert.include(
        stdout,
        command,
        `help for command '${command}' not found`
      );
    });
  });
});
