'use strict';

const BeltHoles_List = require('../src/BeltHoles_List.bs.js');
const Belt_List = require('@rescript/runtime/lib/js/Belt_List.js');
const Belt_MapString = require('@rescript/runtime/lib/js/Belt_MapString.js');
const Belt_Map = require('@rescript/runtime/lib/js/Belt_Map.js');

const list = xs => Belt_List.fromArray(xs);

describe('groupByString', () => {
  test('splits a list into a sublists stored in a Map.String', () => {
    const outMap = BeltHoles_List.groupByString(
      list(['foo', 'Foo', 'Bar', 'FOO', 'bAr', 'baz']),
      s => s.toLowerCase()
    );
    const expectedMap = Belt_MapString.fromArray([
      ['foo', list(['foo', 'Foo', 'FOO'])],
      ['bar', list(['Bar', 'bAr'])],
      ['baz', list(['baz'])],
    ]);
    expect(Belt_MapString.toArray(outMap)).toEqual(Belt_MapString.toArray(expectedMap));
  });
});

describe('groupBy', () => {
  test('splits a list into a sublists stored in a Map', () => {
    // A first-class Belt.Id comparator module compiles down to a plain
    // { cmp } object at runtime -- (int, int) tuples are plain 2-element
    // JS arrays, compared lexicographically here matching the original
    // Pervasives.compare on tuples.
    const id = {
      cmp: (a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]),
    };
    const outMap = BeltHoles_List.groupBy(
      list([
        [1, 'aaa'],
        [1, 'bbb'],
        [2, 'aaa'],
        [1, 'cccc'],
      ]),
      id,
      ([n, s]) => [n, s.length]
    );
    const expectedMap = Belt_Map.fromArray(
      [
        [
          [1, 3],
          list([
            [1, 'aaa'],
            [1, 'bbb'],
          ]),
        ],
        [[2, 3], list([[2, 'aaa']])],
        [[1, 4], list([[1, 'cccc']])],
      ],
      id
    );
    expect(Belt_Map.toArray(outMap)).toEqual(Belt_Map.toArray(expectedMap));
  });
});
