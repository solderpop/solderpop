import { canonicalJson } from '@sdp/foundation';

export interface ParityComparison {
  readonly equal: boolean;
  readonly oldJson: string;
  readonly newJson: string;
}

// Compares two values by canonical (key-sorted) JSON serialization rather
// than deep-equal, so property-order differences between an old JS object
// and its new TS/ReScript-produced equivalent never register as drift --
// only real structural/value differences do.
export default function compareCanonical(
  oldValue: unknown,
  newValue: unknown
): ParityComparison {
  const oldJson = canonicalJson(oldValue);
  const newJson = canonicalJson(newValue);
  return { equal: oldJson === newJson, oldJson, newJson };
}
