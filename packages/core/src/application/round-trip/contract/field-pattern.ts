import type { FieldPattern } from "./round-trip-contract";

const matchSegments = (
  path: ReadonlyArray<string>,
  pattern: ReadonlyArray<string>
): boolean => {
  if (pattern.length === 0) return path.length === 0;
  const [head, ...rest] = pattern;
  if (head === "**") {
    for (let i = 0; i <= path.length; i++) {
      if (matchSegments(path.slice(i), rest)) return true;
    }
    return false;
  }
  if (path.length === 0) return false;
  return (
    (head === "*" || head === path[0]) && matchSegments(path.slice(1), rest)
  );
};

/** True when a dotted KRD path matches a field pattern (`*` one segment, `**` any). */
export const matchesField = (path: string, pattern: FieldPattern): boolean =>
  matchSegments(path.split("."), pattern.split("."));
