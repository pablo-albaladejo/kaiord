import type { KRD } from "@kaiord/core";

type FieldDiff = {
  readonly field: string;
  readonly file1: unknown;
  readonly file2: unknown;
};

export type DiffResult = {
  readonly metadata: FieldDiff[];
  readonly steps: {
    file1Count: number;
    file2Count: number;
    diffs: FieldDiff[];
  };
  readonly extensions: {
    file1Keys: string[];
    file2Keys: string[];
    diffs: FieldDiff[];
  };
};

const METADATA_FIELDS = [
  "created",
  "manufacturer",
  "product",
  "sport",
  "subSport",
  "serialNumber",
] as const;

export const compareKrdFiles = (krd1: KRD, krd2: KRD): DiffResult => ({
  metadata: compareMetadata(krd1, krd2),
  steps: compareSteps(krd1, krd2),
  extensions: compareExtensions(krd1, krd2),
});

const isDifferent = (a: unknown, b: unknown): boolean => {
  if (a === b) return false;
  if (a == null || b == null) return true;
  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) !== JSON.stringify(b);
  }
  return true;
};

const compareMetadata = (krd1: KRD, krd2: KRD): FieldDiff[] => {
  const diffs: FieldDiff[] = [];
  for (const field of METADATA_FIELDS) {
    const v1 = krd1.metadata[field];
    const v2 = krd2.metadata[field];
    if (isDifferent(v1, v2)) {
      diffs.push({ field, file1: v1, file2: v2 });
    }
  }
  return diffs;
};

const getWorkoutSteps = (krd: KRD): unknown[] => {
  const ext = krd.extensions?.structured_workout;
  if (!ext || typeof ext !== "object" || Array.isArray(ext)) return [];
  const w = ext as Record<string, unknown>;
  return Array.isArray(w.steps) ? w.steps : [];
};

const compareSteps = (krd1: KRD, krd2: KRD): DiffResult["steps"] => {
  const s1 = getWorkoutSteps(krd1);
  const s2 = getWorkoutSteps(krd2);
  const diffs: FieldDiff[] = [];
  const max = Math.max(s1.length, s2.length);
  for (let i = 0; i < max; i++) {
    if (isDifferent(s1[i], s2[i])) {
      diffs.push({ field: `step[${i}]`, file1: s1[i], file2: s2[i] });
    }
  }
  return { file1Count: s1.length, file2Count: s2.length, diffs };
};

const compareExtensions = (krd1: KRD, krd2: KRD): DiffResult["extensions"] => {
  const e1 = krd1.extensions ?? {};
  const e2 = krd2.extensions ?? {};
  const keys1 = Object.keys(e1);
  const keys2 = Object.keys(e2);
  const allKeys = new Set([...keys1, ...keys2]);
  const diffs: FieldDiff[] = [];
  for (const key of allKeys) {
    if (isDifferent(e1[key], e2[key])) {
      diffs.push({ field: key, file1: e1[key], file2: e2[key] });
    }
  }
  return { file1Keys: keys1, file2Keys: keys2, diffs };
};
