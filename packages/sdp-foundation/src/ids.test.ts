import { describe, expect, it } from 'vitest';
import { asId, newId } from './ids.js';

describe('ids', () => {
  it('newId generates a unique id each call', () => {
    const a = newId<'NodeId'>();
    const b = newId<'NodeId'>();
    expect(a).not.toBe(b);
    expect(typeof a).toBe('string');
  });

  it('asId wraps an existing raw string as-is', () => {
    expect(asId<'NodeId'>('existing-id')).toBe('existing-id');
  });
});
