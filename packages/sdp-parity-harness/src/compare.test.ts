import { describe, expect, it } from 'vitest';
import compareCanonical from './compare.js';

describe('compareCanonical', () => {
  it('treats key-order differences as equal', () => {
    const result = compareCanonical({ a: 1, b: 2 }, { b: 2, a: 1 });
    expect(result.equal).toBe(true);
  });

  it('flags real value differences as unequal', () => {
    const result = compareCanonical({ a: 1 }, { a: 2 });
    expect(result.equal).toBe(false);
    expect(result.oldJson).not.toBe(result.newJson);
  });
});
