/**
 * SYNTHETIC MyTANITA "export-csv" fixture for tests.
 *
 * The header mirrors the real 28-column export verbatim (verified shape:
 * scalar metrics, then segmental muscle / muscle-quality / body-fat columns,
 * then heart rate). Every DATA value below is MADE UP — no real user data is
 * committed. Rows are hand-picked to exercise the parser edges:
 *
 *  - Row 1: fully populated scalar metrics; all segmental cells `-`.
 *  - Row 2: a quoted numeric field plus several `-` missing scalar metrics.
 *  - Row 3: weight present but EVERY composition metric `-` (body-composition
 *    must be skipped, leaving a weight-only document).
 */

export const TANITA_HEADER =
  'Date,"Weight (kg)",BMI,"Body Fat (%)","Visc Fat","Muscle Mass (kg)",' +
  '"Muscle Quality","Bone Mass (kg)","BMR (kcal)","Metab Age",' +
  '"Body Water (%)","Physique Rating","Muscle mass - right arm",' +
  '"Muscle mass - left arm","Muscle mass - right leg",' +
  '"Muscle mass - left leg","Muscle mass - trunk",' +
  '"Muscle quality - right arm","Muscle quality - left arm",' +
  '"Muscle quality - right leg","Muscle quality - left leg",' +
  '"Muscle quality - trunk","Body fat (%) - right arm",' +
  '"Body fat (%) - left arm","Body fat (%) - right leg",' +
  '"Body fat (%) - left leg","Body fat (%) - trunk","Heart rate"';

const ROW_FULL =
  '"2021-01-28 08:04:11",80.00,26.00,18.00,7.00,60.00,73.00,3.20,' +
  "1800.00,30.00,55.00,5.00,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-";

const ROW_PARTIAL =
  '"2021-02-15 07:30:00","81.50",-,20.00,-,-,-,-,1750.00,-,-,-,' +
  "-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-";

const ROW_WEIGHT_ONLY =
  '"2021-03-01 09:12:45",79.25,-,-,-,-,-,-,-,-,-,-,' +
  "-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-";

/** Header + three synthetic data rows joined with `\n`. */
export const TANITA_CSV_FIXTURE = [
  TANITA_HEADER,
  ROW_FULL,
  ROW_PARTIAL,
  ROW_WEIGHT_ONLY,
].join("\n");
