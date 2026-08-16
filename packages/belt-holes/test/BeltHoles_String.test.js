'use strict';

const BeltHoles_String = require('../src/BeltHoles_String.bs.js');
const Belt_List = require('@rescript/runtime/lib/js/Belt_List.js');

const list = xs => Belt_List.fromArray(xs);

describe('join', () => {
  test('returns empty for empty', () => {
    expect(BeltHoles_String.join(list([]), ', ')).toEqual('');
  });
  test('returns identity for a single string', () => {
    expect(BeltHoles_String.join(list(['Hello']), ', ')).toEqual('Hello');
  });
  test('inserts delimiter between pairs', () => {
    expect(BeltHoles_String.join(list(['Hello', 'wonderful', 'world']), ', ')).toEqual(
      'Hello, wonderful, world'
    );
  });
});

describe('indent', () => {
  test('indents empty', () => {
    expect(BeltHoles_String.indent('', 2)).toEqual('  ');
  });
  test('indents at line breaks', () => {
    expect(BeltHoles_String.indent('foo();\nbar();', 2)).toEqual('  foo();\n' + '  bar();');
  });
});

describe('reverse', () => {
  test('returns empty for empty', () => {
    expect(BeltHoles_String.reverse('')).toEqual('');
  });
  test('indeed reverses', () => {
    expect(BeltHoles_String.reverse('Hello')).toEqual('olleH');
  });
});
