// Garmin Connect wire-format limits and assumed values.
// Each constant names a Garmin protocol bound so truncations and
// fallbacks are greppable rather than inline literals.

/**
 * Maximum length for a workout name. This is the hard bound the Garmin
 * Connect API enforces on `workoutName` (see `workout-input.schema.ts`,
 * `z.string().min(1).max(255)`); names longer than this are rejected by
 * the service, so we truncate before sending and when reading back.
 */
export const GARMIN_NAME_MAX = 255;

/**
 * Maximum length we retain for a step's free-text notes (`description`).
 * This is a deliberately conservative limit (one more than `GARMIN_NAME_MAX`)
 * that the FIT adapter also uses for its notes field, keeping notes
 * truncation consistent across the FIT and Garmin write paths. It is a
 * distinct concept from `GARMIN_NAME_MAX`: a name is a short title bound by
 * the API schema, whereas notes are longer prose. The off-by-one between the
 * two values is therefore intentional, not an accidental discrepancy.
 */
export const GARMIN_STEP_NOTES_MAX = 256;
