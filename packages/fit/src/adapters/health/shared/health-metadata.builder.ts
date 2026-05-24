/**
 * Shared helpers for building the `metadata` block of a health KRD
 * from the raw FIT file_id message. Health KRDs MUST omit
 * `metadata.sport` per the conditional refinement in `krd-format`, so
 * the produced metadata is workout-free by construction.
 */

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number";

const MS_PER_S = 1000;

export const convertFitTimeCreatedToIso = (timeCreated: unknown): string => {
  if (timeCreated instanceof Date) return timeCreated.toISOString();
  if (isNumber(timeCreated))
    return new Date(timeCreated * MS_PER_S).toISOString();
  return new Date().toISOString();
};

export type HealthMetadata = {
  created: string;
  manufacturer?: string;
  product?: string;
};

export const buildHealthMetadata = (
  fileId: Record<string, unknown> | undefined
): HealthMetadata => ({
  created: convertFitTimeCreatedToIso(fileId?.timeCreated),
  manufacturer: isString(fileId?.manufacturer)
    ? fileId.manufacturer
    : undefined,
  product: isNumber(fileId?.product) ? String(fileId.product) : undefined,
});
