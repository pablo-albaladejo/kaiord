import type { LabExtraction } from "../agents/lab-extraction-schema";
import type { LabCheck } from "./lab-extraction-checks";
import { check, checkRow } from "./lab-extraction-checks";
import type { LabExpectation } from "./lab-extraction-fixture";

export type {
  LabCheck,
  LabDimension,
  LabExtractionRow,
} from "./lab-extraction-checks";
export { DIMENSIONS_PER_ROW } from "./lab-extraction-checks";

/**
 * A malformed extraction is a harness fault, not a score of zero: a scorer
 * that folds "the model returned a shape I do not understand" into "the model
 * did badly" reports a number where it should report a broken instrument.
 */
export type LabScore =
  { ok: true; checks: LabCheck[] } | { ok: false; harnessFault: string };

const norm = (label: string): string => label.trim().toLowerCase();

export const scoreLabExtraction = (
  output: unknown,
  rows: readonly LabExpectation[],
  metadata: { date: string; fasting: boolean }
): LabScore => {
  const values = (output as LabExtraction | undefined)?.values;
  if (!Array.isArray(values)) {
    return { ok: false, harnessFault: `values is ${typeof values}, not array` };
  }
  const extraction = output as LabExtraction;
  const byLabel = new Map(values.map((v) => [norm(v.label ?? ""), v]));
  const checks = rows.flatMap((row) =>
    checkRow(row, byLabel.get(norm(row.label)))
  );
  checks.push(check("metadata", "date", extraction.date === metadata.date));
  checks.push(
    check("metadata", "fasting", extraction.fasting === metadata.fasting)
  );
  return { ok: true, checks };
};
