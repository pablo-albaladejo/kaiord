// Garmin Connect wire-format limits and assumed values.
// Each constant names a Garmin protocol bound so truncations and
// fallbacks are greppable rather than inline literals.

/**
 * Maximum length for a workout name. This is the hard bound the Garmin
 * Connect API enforces on `workoutName` (`workoutName` is
 * limited to 1-255 characters); names longer than this are rejected by
 * the service, so we truncate before sending and when reading back.
 */
export const GARMIN_NAME_MAX = 255;

/**
 * Maximum length we send for a step's free-text `description`. Garmin
 * publishes no bound for it; Garmin Connect's web workout builder counts a
 * step note up to 200 characters, so the writer cuts a longer one there and
 * the Garmin bridge's request gate refuses anything over it. Provisional
 * until a live Garmin capture measures the real limit. Reading is bound by
 * the longest note a KRD step holds instead (`STEP_NOTE_MAX` in core).
 */
export const GARMIN_STEP_NOTES_MAX = 200;

/**
 * Maximum length we send for a workout's free-text `description`. Garmin
 * publishes no bound for it; this is a conservative cap, matched by the
 * Garmin bridge's request gate, so a long coach text is cut on write rather
 * than refused. Provisional until a live Garmin capture measures the real
 * limit.
 */
export const GARMIN_DESCRIPTION_MAX = 1024;
