import { describe, expect, it } from 'vitest';
import { runParityCase, runParitySuite } from './runner.js';

describe('runParityCase', () => {
  it('compares sync implementations', async () => {
    const result = await runParityCase(
      { id: 'double-2', input: 2 },
      (n: number) => n * 2,
      (n: number) => n + n
    );
    expect(result).toMatchObject({ id: 'double-2', equal: true });
  });

  it('compares async implementations', async () => {
    const result = await runParityCase(
      { id: 'async-double-2', input: 2 },
      async (n: number) => n * 2,
      async (n: number) => n + n
    );
    expect(result.equal).toBe(true);
  });

  it('flags a mismatch between old and new output', async () => {
    const result = await runParityCase(
      { id: 'off-by-one', input: 2 },
      (n: number) => n * 2,
      (n: number) => n * 2 + 1
    );
    expect(result.equal).toBe(false);
  });
});

describe('runParitySuite', () => {
  it('aggregates pass/fail counts across a corpus', async () => {
    const cases = [
      { id: 'a', input: 1 },
      { id: 'b', input: 2 },
      { id: 'c', input: 3 },
    ];
    const suite = await runParitySuite(
      cases,
      (n: number) => n,
      (n: number) => (n === 2 ? 99 : n)
    );
    expect(suite.total).toBe(3);
    expect(suite.passed).toBe(2);
    expect(suite.failed.map((f) => f.id)).toEqual(['b']);
  });
});
