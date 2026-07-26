/**
 * @kaiord/tanita — MyTANITA "export-csv" health adapter for Kaiord.
 *
 * A PURE, offline adapter over the MyTANITA (mytanita.eu) CSV export. It
 * performs no network I/O and contains no browser-extension code; it only
 * parses the flat CSV into KRD health documents. Each measurement row yields
 * one KRD carrying a `weight` measurement and/or a `bodyComposition` snapshot
 * under `extensions.health`. Columns without a KRD home (segmental muscle /
 * fat, muscle quality, metabolic age, physique rating, heart rate) are
 * intentionally deferred — see `TANITA_DEFERRED_COLUMNS`.
 */

// Pure converter (MyTANITA export-csv → KRD health documents)
export {
  TANITA_COLUMN_HEADERS,
  TANITA_DEFERRED_COLUMNS,
  tanitaCsvToKrd,
} from "./adapters/converters/tanita-csv-to-krd.converter";

// Row schema & inferred type
export {
  TANITA_MISSING_TOKEN,
  type TanitaMeasurement,
  tanitaMeasurementSchema,
} from "./adapters/schemas/tanita-measurement.schema";
