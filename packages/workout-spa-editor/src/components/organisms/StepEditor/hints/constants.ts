/**
 * First Time Hints Constants
 *
 * Constants for the first-time hints feature.
 */

export const DEFAULT_STORAGE_KEY = "workout-spa-first-workout-hints-dismissed";

// Stable ids only; the title/message copy lives in the `editor` i18n namespace
// under `firstTimeHints.<id>` and is resolved at render time.
export const HINTS = [{ id: "duration" }, { id: "target" }, { id: "save" }];

export const HINT_ROTATION_INTERVAL = 5000; // 5 seconds
