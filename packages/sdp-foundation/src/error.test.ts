import { describe, expect, it } from 'vitest';
import { SdpError } from './error.js';

describe('SdpError', () => {
  it('carries a stable code and message', () => {
    const e = new SdpError({
      code: 'INVALID_XODBALL_FORMAT',
      message: 'bad format',
    });
    expect(e.code).toBe('INVALID_XODBALL_FORMAT');
    expect(e.message).toBe('bad format');
    expect(e).toBeInstanceOf(Error);
  });

  it('preserves a real stack trace', () => {
    const e = new SdpError({ code: 'X', message: 'y' });
    expect(e.stack).toContain('SdpError');
  });

  it('preserves a wrapped cause', () => {
    const cause = new Error('original');
    const e = new SdpError({ code: 'X', message: 'wrapped', cause });
    expect(e.cause).toBe(cause);
  });
});
