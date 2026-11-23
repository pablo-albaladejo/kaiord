import type { RawValue } from "./resolve-pace-literals";

/**
 * A pace the coach names by reference ("at 10K pace", "ritmo umbral") becomes
 * the athlete's pace zone for it; `resolveZoneTargets` then puts the numbers.
 * The zones follow the App's pace model, whose bounds are fractions of the
 * threshold speed (Z3 90–95%, Z4 95–102%, Z5 above 102%): marathon pace sits
 * in Z3, half-marathon and threshold pace in Z4, 10K pace across the Z4/Z5
 * boundary, and 5K pace in Z5.
 */
export const PACE_REFERENCE_ZONES: Record<string, RawValue> = {
  marathon: { unit: "zone", value: 3 },
  half_marathon: { unit: "zone", value: 4 },
  threshold: { unit: "zone", value: 4 },
  "10k": { unit: "zone", min: 4, max: 5 },
  "5k": { unit: "zone", value: 5 },
};

export const resolveReference = (value: RawValue): RawValue => {
  if (value.unit !== "reference") return value;
  const zone = PACE_REFERENCE_ZONES[String(value.reference)];
  if (!zone) {
    throw new Error(
      `reference "${String(value.reference)}" is not one of ${Object.keys(PACE_REFERENCE_ZONES).join(", ")}`
    );
  }
  return zone;
};

/** A % max heart-rate range is carried as its midpoint. */
export const resolveHeartRateValue = (value: RawValue): RawValue => {
  if (value.unit !== "percent_max") return value;
  if (typeof value.min !== "number" || typeof value.max !== "number")
    return value;
  return { unit: "percent_max", value: (value.min + value.max) / 2 };
};
