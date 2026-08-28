export interface SdpErrorInit {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}

// Preserves a real stack trace and a stable machine-readable `code`,
// replacing the ramda-fantasy Either-wrapped plain-object error stanzas
// (e.g. patch.js's `{ error: '...' }` shapes) that lost their origin
// once passed through a chain of `.either()`/`.chain()` calls.
export class SdpError extends Error {
  readonly code: string;

  constructor(init: SdpErrorInit) {
    super(
      init.message,
      init.cause !== undefined ? { cause: init.cause } : undefined
    );
    this.name = 'SdpError';
    this.code = init.code;
  }
}
