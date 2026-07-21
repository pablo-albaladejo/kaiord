import { z } from "zod";

/**
 * Schema for a single parsed MyTANITA "export-csv" measurement row.
 *
 * The MyTANITA export is a flat CSV: one header row then one row per
 * weigh-in. Cells arrive as raw strings; a missing/unmeasured cell is the
 * literal `-` (never `0`). This schema turns a raw string record — keyed by
 * the KRD-aligned semantic names the converter extracts — into typed values,
 * coercing `-`/empty to `undefined` and numeric strings (`.` decimals) to
 * numbers. Per-field range invariants (positive weight, 0–100 percentages …)
 * are intentionally NOT enforced here; they are validated downstream when the
 * KRD `weight`/`bodyComposition` payloads are assembled and `krdSchema`-parsed.
 *
 * Timezone decision: the MyTANITA `Date` cell is a naive local wall-clock
 * datetime (`YYYY-MM-DD HH:MM:SS`) carrying no offset. We anchor it to UTC —
 * the wall-clock components are preserved verbatim and stamped with `Z` (e.g.
 * `2021-01-28 08:04:11` → `2021-01-28T08:04:11.000Z`). No offset shift is
 * applied because the source provides none; consumers that know the scale's
 * real zone can re-anchor from the preserved components.
 */

/** The literal MyTANITA "no measurement" token. */
export const TANITA_MISSING_TOKEN = "-";

/** `YYYY-MM-DD HH:MM:SS` — the MyTANITA local-datetime shape. */
const LOCAL_DATETIME_RE = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/;

/**
 * Coerces a raw MyTANITA numeric cell: `-`/empty → `undefined`, a numeric
 * string → its `number`, anything else passes through so `z.number()` rejects
 * it. Reused for every optional numeric column.
 */
const optionalNumber = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === TANITA_MISSING_TOKEN) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().optional());

export const tanitaMeasurementSchema = z.object({
  /** From the `Date` column; emitted as a UTC-anchored ISO 8601 string. */
  measuredAt: z.string().transform((value, ctx) => {
    const match = LOCAL_DATETIME_RE.exec(value.trim());
    const datePart = match?.[1];
    const timePart = match?.[2];
    if (!datePart || !timePart) {
      ctx.addIssue({
        code: "custom",
        message: `Unrecognized MyTANITA datetime: "${value}" (expected "YYYY-MM-DD HH:MM:SS").`,
      });
      return z.NEVER;
    }
    return `${datePart}T${timePart}.000Z`;
  }),
  /** `Weight (kg)`. */
  weightKilograms: optionalNumber,
  /** `BMI`. */
  bmi: optionalNumber,
  /** `Body Fat (%)`. */
  bodyFatPercent: optionalNumber,
  /** `Visc Fat`. */
  visceralFatRating: optionalNumber,
  /** `Muscle Mass (kg)`. */
  leanMassKilograms: optionalNumber,
  /** `Bone Mass (kg)`. */
  boneMassKilograms: optionalNumber,
  /** `BMR (kcal)`. */
  basalMetabolicRateKcal: optionalNumber,
  /** `Body Water (%)`. */
  bodyWaterPercent: optionalNumber,
});

export type TanitaMeasurement = z.infer<typeof tanitaMeasurementSchema>;
