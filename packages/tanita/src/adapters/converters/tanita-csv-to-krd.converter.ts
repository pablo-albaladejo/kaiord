import type { BodyComposition, KRD, WeightMeasurement } from "@kaiord/core";
import { krdSchema } from "@kaiord/core";

import {
  type TanitaMeasurement,
  tanitaMeasurementSchema,
} from "../schemas/tanita-measurement.schema";

const KRD_VERSION = "2.0" as const;
const HEALTH_VERSION = "2.0";
const MANUFACTURER = "tanita";
const WEIGHT_MEASUREMENT_TYPE = "weight_measurement" as const;
const BODY_COMPOSITION_TYPE = "body_composition" as const;

/**
 * MyTANITA header label → KRD-aligned semantic key. Column order in the
 * export has drifted over time (segmental columns went from empty to named),
 * so the converter matches by exact header label, never by fixed index.
 */
export const TANITA_COLUMN_HEADERS = {
  measuredAt: "Date",
  weightKilograms: "Weight (kg)",
  bmi: "BMI",
  bodyFatPercent: "Body Fat (%)",
  visceralFatRating: "Visc Fat",
  leanMassKilograms: "Muscle Mass (kg)",
  boneMassKilograms: "Bone Mass (kg)",
  basalMetabolicRateKcal: "BMR (kcal)",
  bodyWaterPercent: "Body Water (%)",
} as const;

/**
 * MyTANITA columns intentionally NOT mapped: they have no KRD home yet and
 * are dropped on purpose. To add one later, add the KRD field first, then map
 * it in `TANITA_COLUMN_HEADERS` and the payload builders below.
 */
export const TANITA_DEFERRED_COLUMNS = [
  "Muscle Quality",
  "Metab Age",
  "Physique Rating",
  "Muscle mass - right arm",
  "Muscle mass - left arm",
  "Muscle mass - right leg",
  "Muscle mass - left leg",
  "Muscle mass - trunk",
  "Muscle quality - right arm",
  "Muscle quality - left arm",
  "Muscle quality - right leg",
  "Muscle quality - left leg",
  "Muscle quality - trunk",
  "Body fat (%) - right arm",
  "Body fat (%) - left arm",
  "Body fat (%) - right leg",
  "Body fat (%) - left leg",
  "Body fat (%) - trunk",
  "Heart rate",
] as const;

type RawMeasurement = Record<
  keyof typeof TANITA_COLUMN_HEADERS,
  string | undefined
>;

/**
 * Tokenizes a CSV string into rows of cells (RFC-4180-lite): supports quoted
 * fields, `""` escaped quotes inside a quoted field, `,` separators, and both
 * `\n` and `\r\n` line endings. A trailing newline does not yield a spurious
 * empty final row.
 */
const tokenizeCsv = (input: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const pushField = (): void => {
    row.push(field);
    field = "";
  };
  const pushRow = (): void => {
    pushField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
};

/** Maps each header label to its first column index. */
const buildHeaderIndex = (header: string[]): Map<string, number> => {
  const index = new Map<string, number>();
  header.forEach((label, position) => {
    const key = label.trim();
    if (!index.has(key)) index.set(key, position);
  });
  return index;
};

const cellAt = (
  cells: string[],
  position: number | undefined
): string | undefined => (position === undefined ? undefined : cells[position]);

/** Extracts the mapped columns from a data row keyed by semantic name. */
const extractRawMeasurement = (
  cells: string[],
  headerIndex: Map<string, number>
): RawMeasurement => {
  const raw = {} as RawMeasurement;
  for (const key of Object.keys(
    TANITA_COLUMN_HEADERS
  ) as (keyof typeof TANITA_COLUMN_HEADERS)[]) {
    raw[key] = cellAt(cells, headerIndex.get(TANITA_COLUMN_HEADERS[key]));
  }
  return raw;
};

const isBlankRow = (cells: string[]): boolean =>
  cells.every((cell) => cell.trim() === "");

/** Builds the scalar weight payload, or `undefined` when weight is absent. */
const buildWeight = (
  measurement: TanitaMeasurement
): WeightMeasurement | undefined => {
  const { weightKilograms } = measurement;
  if (weightKilograms === undefined || weightKilograms <= 0) return undefined;
  return {
    kind: "weight",
    version: HEALTH_VERSION,
    measuredAt: measurement.measuredAt,
    weightKilograms,
  };
};

/** Collects the present body-composition metrics (skips `undefined`). */
const collectComposition = (
  measurement: TanitaMeasurement
): Partial<BodyComposition> => {
  const out: Partial<BodyComposition> = {};
  if (measurement.bmi !== undefined) out.bmi = measurement.bmi;
  if (measurement.bodyFatPercent !== undefined)
    out.bodyFatPercent = measurement.bodyFatPercent;
  if (measurement.visceralFatRating !== undefined)
    out.visceralFatRating = measurement.visceralFatRating;
  if (measurement.leanMassKilograms !== undefined)
    out.leanMassKilograms = measurement.leanMassKilograms;
  if (measurement.boneMassKilograms !== undefined)
    out.boneMassKilograms = measurement.boneMassKilograms;
  if (measurement.basalMetabolicRateKcal !== undefined)
    out.basalMetabolicRateKcal = measurement.basalMetabolicRateKcal;
  if (measurement.bodyWaterPercent !== undefined)
    out.bodyWaterPercent = measurement.bodyWaterPercent;
  return out;
};

/**
 * Builds the body-composition payload, or `undefined` when every composition
 * column of the row is missing (`-`) — honouring the KRD schema's
 * at-least-one-field refinement.
 */
const buildBodyComposition = (
  measurement: TanitaMeasurement
): BodyComposition | undefined => {
  const fields = collectComposition(measurement);
  if (Object.keys(fields).length === 0) return undefined;
  return {
    kind: "bodyComposition",
    version: HEALTH_VERSION,
    measuredAt: measurement.measuredAt,
    ...fields,
  };
};

/**
 * Assembles one KRD health document from a parsed row. Rows carrying neither
 * a weight nor any composition metric produce nothing. The KRD `type` is
 * `body_composition` when composition metrics exist, else `weight_measurement`.
 * The result is `krdSchema`-parsed so callers always receive validated output.
 */
const measurementToKrd = (measurement: TanitaMeasurement): KRD | undefined => {
  const weight = buildWeight(measurement);
  const bodyComposition = buildBodyComposition(measurement);
  if (!weight && !bodyComposition) return undefined;
  const health: {
    weight?: WeightMeasurement;
    bodyComposition?: BodyComposition;
  } = {};
  if (weight) health.weight = weight;
  if (bodyComposition) health.bodyComposition = bodyComposition;
  return krdSchema.parse({
    version: KRD_VERSION,
    type: bodyComposition ? BODY_COMPOSITION_TYPE : WEIGHT_MEASUREMENT_TYPE,
    metadata: { created: measurement.measuredAt, manufacturer: MANUFACTURER },
    extensions: { health },
  });
};

/**
 * Parses a MyTANITA "export-csv" string into one KRD health document per
 * measurement row. Blank and malformed rows are skipped; each emitted KRD is
 * validated against `krdSchema`. Pure and offline — no network, no I/O.
 */
export const tanitaCsvToKrd = (csv: string): KRD[] => {
  const rows = tokenizeCsv(csv);
  const [header, ...dataRows] = rows;
  if (!header) return [];
  const headerIndex = buildHeaderIndex(header);
  const documents: KRD[] = [];
  for (const cells of dataRows) {
    if (isBlankRow(cells)) continue;
    const parsed = tanitaMeasurementSchema.safeParse(
      extractRawMeasurement(cells, headerIndex)
    );
    if (!parsed.success) continue;
    const document = measurementToKrd(parsed.data);
    if (document) documents.push(document);
  }
  return documents;
};
