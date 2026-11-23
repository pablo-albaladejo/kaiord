import type { SourceValue } from "./first-read-report";

/**
 * Every leaf of a parsed source file (an XML tree, a JSON document, decoded
 * FIT messages) by its dotted path. Array positions add no segment, so every
 * step's name is `…Step.Name`; each value keeps the record that holds it
 * and every record around that one, outermost first.
 */
export const sourceValuesOf = (
  node: unknown,
  path = "",
  ancestors: ReadonlyArray<Record<string, unknown>> = [],
  out: Array<SourceValue> = []
): Array<SourceValue> => {
  if (node === undefined || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) sourceValuesOf(item, path, ancestors, out);
    return out;
  }
  if (typeof node !== "object") {
    const context = ancestors[ancestors.length - 1] ?? {};
    out.push({ field: path, value: node, context, ancestors });
    return out;
  }
  const record = node as Record<string, unknown>;
  const inside = [...ancestors, record];
  for (const [key, child] of Object.entries(record)) {
    sourceValuesOf(child, path === "" ? key : `${path}.${key}`, inside, out);
  }
  return out;
};
