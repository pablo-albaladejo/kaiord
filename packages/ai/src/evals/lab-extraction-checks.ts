import type { LabExtraction } from "../agents/lab-extraction-schema";
import type { LabExpectation } from "./lab-extraction-fixture";

export type LabDimension = "key" | "value" | "unit" | "reference" | "metadata";

export type LabCheck = {
  dimension: LabDimension;
  subject: string;
  pass: boolean;
  detail?: string;
};

export type LabExtractionRow = LabExtraction["values"][number];

/** Every row contributes a key, a value and a reference check. */
export const DIMENSIONS_PER_ROW = 3;

const VALUE_EPSILON = 1e-6;

export const check = (
  dimension: LabDimension,
  subject: string,
  pass: boolean,
  detail?: string
): LabCheck => ({ dimension, subject, pass, detail });

const near = (a: number | undefined, b: number): boolean =>
  a !== undefined && Math.abs(a - b) < VALUE_EPSILON;

/**
 * `< 5,0` and `< 5.0` are the same printed range, so the decimal comma is
 * normalized rather than deleted — deleting it turns `5,0` into `50`.
 */
const normRef = (text: string): string =>
  text.replace(/,/g, ".").replace(/\s/g, "");

const sameRefText = (a: string | undefined, b: string): boolean =>
  a !== undefined && normRef(a) === normRef(b);

const checkKey = (row: LabExpectation, got: LabExtractionRow): LabCheck => {
  if (row.key === null) {
    const omitted = got.parameterKey === undefined;
    return check(
      "key",
      row.label,
      omitted,
      omitted
        ? "correctly omitted (outside the catalog)"
        : `guessed "${got.parameterKey}" for an uncatalogued parameter`
    );
  }
  return check(
    "key",
    row.label,
    got.parameterKey === row.key,
    `expected ${row.key}, got ${got.parameterKey ?? "(omitted)"}`
  );
};

const checkReference = (
  row: LabExpectation,
  got: LabExtractionRow
): LabCheck => {
  if (row.refText !== undefined) {
    return check(
      "reference",
      row.label,
      sameRefText(got.refText, row.refText),
      `expected refText ${row.refText}, got ${got.refText ?? "(none)"}`
    );
  }
  const pass = near(got.refLow, row.refLow!) && near(got.refHigh, row.refHigh!);
  return check(
    "reference",
    row.label,
    pass,
    `expected ${row.refLow}-${row.refHigh}, got ${got.refLow}-${got.refHigh}`
  );
};

export const checkRow = (
  row: LabExpectation,
  got: LabExtractionRow | undefined
): LabCheck[] => {
  if (!got) {
    const missing = (d: LabDimension): LabCheck =>
      check(d, row.label, false, "row not extracted");
    return [missing("key"), missing("value"), missing("reference")];
  }
  const checks = [
    checkKey(row, got),
    check("value", row.label, near(got.value, row.value)),
    checkReference(row, got),
  ];
  if (row.unit !== undefined) {
    checks.push(check("unit", row.label, got.unit === row.unit));
  }
  return checks;
};
