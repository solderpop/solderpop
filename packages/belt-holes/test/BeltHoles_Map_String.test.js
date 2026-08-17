'use strict';

const BeltHoles_Map_String = require('../src/BeltHoles_Map_String.bs.js');
const Belt_MapString = require('@rescript/runtime/lib/js/Belt_MapString.js');

// Belt_MapString.toArray returns entries sorted by key, so comparing the
// resulting plain array is a stable, order-independent equivalent of the
// old custom `toEqualMap` matcher.
const mapOf = entries => Belt_MapString.fromArray(entries);
const arrayOf = map => Belt_MapString.toArray(map);

describe('Key mapping', () => {
  test('changes keys, preserves data', () => {
    const inMap = mapOf([
      ['one', 1],
      ['two', 2],
      ['three', 3],
    ]);
    const outMap = BeltHoles_Map_String.mapKeys(inMap, s => s.toUpperCase());
    const expectedMap = mapOf([
      ['ONE', 1],
      ['TWO', 2],
      ['THREE', 3],
    ]);
    expect(arrayOf(outMap)).toEqual(arrayOf(expectedMap));
  });

  test('supports swaps', () => {
    const inMap = mapOf([
      ['foo', 'was foo'],
      ['oof', 'was oof'],
    ]);
    const BeltHoles_String = require('../src/BeltHoles_String.bs.js');
    const outMap = BeltHoles_Map_String.mapKeys(inMap, BeltHoles_String.reverse);
    const expectedMap = mapOf([
      ['oof', 'was foo'],
      ['foo', 'was oof'],
    ]);
    expect(arrayOf(outMap)).toEqual(arrayOf(expectedMap));
  });
});

describe('Inner join', () => {
  test('applies transitive associations', () => {
    const left = mapOf([
      ['quad', 'four'],
      ['hexa', 'six'],
      ['octo', 'eight'],
    ]);
    const right = mapOf([
      ['four', 4],
      ['six', 6],
      ['eight', 8],
    ]);
    const outMap = BeltHoles_Map_String.innerJoin(left, right);
    const expectedMap = mapOf([
      ['quad', 4],
      ['hexa', 6],
      ['octo', 8],
    ]);
    expect(arrayOf(outMap)).toEqual(arrayOf(expectedMap));
  });
});

describe('mergeOverride', () => {
  test('merges preferring keys from second arg', () => {
    const left = mapOf([
      ['quad', 'four'],
      ['hexa', 'six'],
    ]);
    const right = mapOf([
      ['quad', '4'],
      ['octo', '8'],
    ]);
    const outMap = BeltHoles_Map_String.mergeOverride(left, right);
    const expectedMap = mapOf([
      ['quad', '4'],
      ['hexa', 'six'],
      ['octo', '8'],
    ]);
    expect(arrayOf(outMap)).toEqual(arrayOf(expectedMap));
  });
});
