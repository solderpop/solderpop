import { describe, expect, it } from 'vitest';
import canonicalJson from './canonicalJson.js';

describe('canonicalJson', () => {
  it('produces identical output regardless of key insertion order', () => {
    const a = { z: 1, a: 2, m: { y: 1, x: 2 } };
    const b = { a: 2, z: 1, m: { x: 2, y: 1 } };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it('sorts keys inside arrays of objects too', () => {
    const value = [{ b: 1, a: 2 }];
    expect(canonicalJson(value)).toBe('[{"a":2,"b":1}]');
  });

  it('leaves primitive values as plain JSON', () => {
    expect(canonicalJson('x')).toBe('"x"');
    expect(canonicalJson(42)).toBe('42');
    expect(canonicalJson(null)).toBe('null');
  });
});
