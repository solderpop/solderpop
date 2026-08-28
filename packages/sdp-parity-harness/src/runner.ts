import type { ParityComparison } from './compare.js';
import compareCanonical from './compare.js';

// A single corpus fixture run through both an old JS implementation and
// its new TS/ReScript replacement. `id` should be stable across runs
// (e.g. a workspace project path, or a tab-test case name) so a
// regression can be traced back to the exact fixture that caused it.
export interface ParityCase<Input> {
  readonly id: string;
  readonly input: Input;
}

export interface ParityCaseResult extends ParityComparison {
  readonly id: string;
}

export interface ParitySuiteResult {
  readonly total: number;
  readonly passed: number;
  readonly failed: readonly ParityCaseResult[];
  readonly results: readonly ParityCaseResult[];
}

// Runs the same input through both implementations (either may be sync
// or async) and compares their output by canonical JSON. This is the
// primitive every migrated package's parity gate is built from --
// project-model (Phase 2) plugs in `loadProjectOld`/`loadProjectNew`
// over the workspace/ xodball corpus, sdp-arduino (Phase 3) plugs in
// old/new transpile() over the same corpus, etc. No domain-specific
// logic lives here on purpose: this package only knows how to compare,
// not what a project or a patch is.
export async function runParityCase<Input>(
  parityCase: ParityCase<Input>,
  oldImpl: (input: Input) => unknown | Promise<unknown>,
  newImpl: (input: Input) => unknown | Promise<unknown>
): Promise<ParityCaseResult> {
  const [oldValue, newValue] = await Promise.all([
    oldImpl(parityCase.input),
    newImpl(parityCase.input),
  ]);
  return { id: parityCase.id, ...compareCanonical(oldValue, newValue) };
}

export async function runParitySuite<Input>(
  cases: readonly ParityCase<Input>[],
  oldImpl: (input: Input) => unknown | Promise<unknown>,
  newImpl: (input: Input) => unknown | Promise<unknown>
): Promise<ParitySuiteResult> {
  const results = await Promise.all(
    cases.map((parityCase) => runParityCase(parityCase, oldImpl, newImpl))
  );
  const failed = results.filter((result) => !result.equal);
  return {
    total: results.length,
    passed: results.length - failed.length,
    failed,
    results,
  };
}
