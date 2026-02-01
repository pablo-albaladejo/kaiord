import type { KRD } from "@kaiord/core";

/**
 * Compare two values and return true if they are different
 */
export const isDifferent = (value1: unknown, value2: unknown): boolean => {
  if (value1 === value2) return false;
  if (value1 === null || value1 === undefined) return true;
  if (value2 === null || value2 === undefined) return true;

  if (typeof value1 === "object" && typeof value2 === "object") {
    return JSON.stringify(value1) !== JSON.stringify(value2);
  }

  return value1 !== value2;
};

/**
 * Compare metadata between two KRD files
 */
export const compareMetadata = (
  krd1: KRD,
  krd2: KRD
): Array<{ field: string; file1Value: unknown; file2Value: unknown }> => {
  const differences: Array<{
    field: string;
    file1Value: unknown;
    file2Value: unknown;
  }> = [];

  const metadataFields = [
    "created",
    "manufacturer",
    "product",
    "serialNumber",
    "sport",
    "subSport",
  ] as const;

  for (const field of metadataFields) {
    const value1 = krd1.metadata[field];
    const value2 = krd2.metadata[field];

    if (isDifferent(value1, value2)) {
      differences.push({ field, file1Value: value1, file2Value: value2 });
    }
  }

  return differences;
};

// Re-export compareSteps from dedicated module
export { compareSteps } from "./compare-steps";

/**
 * Compare extensions between two KRD files
 */
export const compareExtensions = (
  krd1: KRD,
  krd2: KRD
): {
  file1Keys: Array<string>;
  file2Keys: Array<string>;
  differences: Array<{
    key: string;
    file1Value: unknown;
    file2Value: unknown;
  }>;
} => {
  const ext1 = krd1.extensions || {};
  const ext2 = krd2.extensions || {};

  const keys1 = Object.keys(ext1);
  const keys2 = Object.keys(ext2);

  const allKeys = new Set([...keys1, ...keys2]);
  const differences: Array<{
    key: string;
    file1Value: unknown;
    file2Value: unknown;
  }> = [];

  for (const key of allKeys) {
    if (isDifferent(ext1[key], ext2[key])) {
      differences.push({ key, file1Value: ext1[key], file2Value: ext2[key] });
    }
  }

  return { file1Keys: keys1, file2Keys: keys2, differences };
};
