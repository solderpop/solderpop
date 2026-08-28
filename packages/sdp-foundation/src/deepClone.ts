export default function deepClone<T>(value: T): T {
  return structuredClone(value);
}
