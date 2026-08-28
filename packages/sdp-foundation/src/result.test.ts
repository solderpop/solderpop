import { describe, expect, it } from 'vitest';
import {
  err,
  flatMap,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  tryCatch,
  unwrapOr,
} from './result.js';

describe('Result', () => {
  it('ok/isOk/isErr', () => {
    const r = ok(1);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
  });

  it('err/isOk/isErr', () => {
    const r = err('boom');
    expect(isOk(r)).toBe(false);
    expect(isErr(r)).toBe(true);
  });

  it('map only transforms the ok branch', () => {
    expect(map(ok(2), (n) => n * 2)).toEqual(ok(4));
    expect(map(err('e'), (n: number) => n * 2)).toEqual(err('e'));
  });

  it('mapErr only transforms the err branch', () => {
    expect(mapErr(ok(2), (e) => `wrapped:${e}`)).toEqual(ok(2));
    expect(mapErr(err('e'), (e) => `wrapped:${e}`)).toEqual(err('wrapped:e'));
  });

  it('flatMap chains ok results and short-circuits on err', () => {
    const halve = (n: number) => (n % 2 === 0 ? ok(n / 2) : err('odd'));
    expect(flatMap(ok(4), halve)).toEqual(ok(2));
    expect(flatMap(ok(3), halve)).toEqual(err('odd'));
    expect(flatMap(err('prior'), halve)).toEqual(err('prior'));
  });

  it('unwrapOr returns the value or the fallback', () => {
    expect(unwrapOr(ok(1), 0)).toBe(1);
    expect(unwrapOr(err('e'), 0)).toBe(0);
  });

  it('tryCatch captures a thrown value as an err', () => {
    const parsed = tryCatch(
      () => JSON.parse('not json'),
      (thrown) => (thrown instanceof Error ? thrown.message : 'unknown')
    );
    expect(isErr(parsed)).toBe(true);

    const ok1 = tryCatch(
      () => JSON.parse('{"a":1}'),
      () => 'unreachable'
    );
    expect(ok1).toEqual(ok({ a: 1 }));
  });
});
