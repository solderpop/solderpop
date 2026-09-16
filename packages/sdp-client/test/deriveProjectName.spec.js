import chai from 'chai';
import deriveProjectName from '../src/utils/deriveProjectName.js';

const { assert } = chai;

describe('Derive project name from filename', () => {
  const test = (input, output) =>
    it(`${input} -> ${output}`, () =>
      assert.equal(deriveProjectName(input), output));

  test('foo.solderball', 'foo');
  test('FooBar.solderball', 'foobar');
  test('FooBar Baz.solderball', 'foobar-baz');
  test('FooBar Baz 2.solderball', 'foobar-baz-2');
  test('FooBar Baz (2).solderball', 'foobar-baz-2');
  test('FooBar Baz (2).whatever.infix.solderball', 'foobar-baz-2');
  test('FooBar Baz (2).whatever.infix', 'foobar-baz-2');
  test('Multifile project', 'multifile-project');
  test('strange_FILE_name---so-is_it_okay?', 'strange-file-name-so-is-it-okay');
});
