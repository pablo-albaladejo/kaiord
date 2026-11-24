const EMPTY_OBJECT = "{}";
const EMPTY_ARRAY = "[]";

/** Every leaf of a value by its dotted path; an empty object or array is a leaf. */
export const leavesOf = (
  value: unknown,
  path = "",
  out = new Map<string, unknown>()
): Map<string, unknown> => {
  if (value === undefined) return out;
  if (value === null || typeof value !== "object") {
    out.set(path, value);
    return out;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    out.set(path, Array.isArray(value) ? EMPTY_ARRAY : EMPTY_OBJECT);
  }
  for (const [key, child] of entries) {
    leavesOf(child, path === "" ? key : `${path}.${key}`, out);
  }
  return out;
};
