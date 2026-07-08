import type { LocaleNamespaces, NamespaceDictionary } from "./types";

export type ParityViolation = {
  namespace: string;
  keyPath: string;
  /** The locale the key is absent from. */
  missingIn: "en" | "es";
};

function flattenKeys(dict: NamespaceDictionary, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [segment, value] of Object.entries(dict)) {
    const path = prefix ? `${prefix}.${segment}` : segment;
    if (typeof value === "string") {
      keys.push(path);
    } else {
      keys.push(...flattenKeys(value, path));
    }
  }
  return keys;
}

function diffNamespace(
  namespace: string,
  en: NamespaceDictionary,
  es: NamespaceDictionary
): ParityViolation[] {
  const enKeys = new Set(flattenKeys(en));
  const esKeys = new Set(flattenKeys(es));
  const violations: ParityViolation[] = [];
  for (const key of enKeys) {
    if (!esKeys.has(key)) {
      violations.push({ namespace, keyPath: key, missingIn: "es" });
    }
  }
  for (const key of esKeys) {
    if (!enKeys.has(key)) {
      violations.push({ namespace, keyPath: key, missingIn: "en" });
    }
  }
  return violations;
}

/**
 * Assert key parity between the `en` and `es` catalogs: every key present in
 * one SHALL exist in the other, per namespace and at every nesting depth.
 * Returns one violation per offending key path; an empty array means parity.
 */
export function findParityViolations(
  en: LocaleNamespaces,
  es: LocaleNamespaces
): ParityViolation[] {
  const namespaces = new Set([...Object.keys(en), ...Object.keys(es)]);
  const violations: ParityViolation[] = [];
  for (const ns of namespaces) {
    violations.push(...diffNamespace(ns, en[ns] ?? {}, es[ns] ?? {}));
  }
  return violations;
}
