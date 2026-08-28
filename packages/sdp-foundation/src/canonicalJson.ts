function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sortedEntries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          [key, sortKeysDeep((value as Record<string, unknown>)[key])] as const
      );
    return Object.fromEntries(sortedEntries);
  }
  return value;
}

// Deterministic JSON serialization (keys sorted at every level) so two
// structurally-equal values -- e.g. the same xodball produced by an old
// JS code path and a new TS/ReScript one -- serialize byte-identical
// regardless of property insertion order. This is the parity harness's
// comparison primitive (see tools/parity/); it does not itself add or
// interpret `@@type` discriminator tags -- that is project-model's job
// once entities are ported (Phase 2), not foundation's.
export default function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}
