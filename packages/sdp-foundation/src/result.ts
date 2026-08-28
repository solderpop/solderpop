export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<E, T = never>(error: E): Result<T, E> {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>
): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return !result.ok;
}

export function map<T, U, E>(
  result: Result<T, E>,
  f: (value: T) => U
): Result<U, E> {
  return result.ok ? ok(f(result.value)) : result;
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  f: (error: E) => F
): Result<T, F> {
  return result.ok ? result : err(f(result.error));
}

export function flatMap<T, U, E>(
  result: Result<T, E>,
  f: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? f(result.value) : result;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export function tryCatch<T, E = unknown>(
  f: () => T,
  onError: (thrown: unknown) => E
): Result<T, E> {
  try {
    return ok(f());
  } catch (thrown) {
    return err(onError(thrown));
  }
}
