/**
 * First Time Hints Constants
 *
 * Constants for the first-time hints feature.
 */

export const DEFAULT_STORAGE_KEY = "workout-spa-first-workout-hints-dismissed";

export const HINTS = [
  {
    id: "duration",
    title: "Set Duration",
    message:
      "Choose how long this step should last - by time, distance, or open-ended.",
  },
  {
    id: "target",
    title: "Set Target",
    message:
      "Define your training intensity using power, heart rate, pace, or cadence zones.",
  },
  {
    id: "save",
    title: "Save Your Step",
    message:
      "Click Save to add this step to your workout. You can edit it anytime.",
  },
];

export const HINT_ROTATION_INTERVAL = 5000; // 5 seconds
