import { describe, expect, it } from 'vitest';
import deepClone from './deepClone.js';

describe('deepClone', () => {
  it('produces a structurally-equal but referentially-distinct copy', () => {
    const original = { a: 1, nested: { b: [1, 2, 3] } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.nested).not.toBe(original.nested);
  });

  it('mutating the clone does not affect the original', () => {
    const original = { list: [1, 2, 3] };
    const cloned = deepClone(original);
    cloned.list.push(4);
    expect(original.list).toEqual([1, 2, 3]);
  });
});
