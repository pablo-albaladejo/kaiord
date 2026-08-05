/**
 * WorkoutCard Utilities
 *
 * Lifecycle emphasis and duration formatting.
 *
 * The lifecycle used to be a hue-coded glyph per state (`\u26A0\uFE0F` amber, `\u2605`
 * green) sitting beside the title, duplicating the lateral border in two hues
 * the palette no longer carries. It is now a word in a chip, so the only thing
 * left to decide is whether that word needs the user \u2014 and only two states do.
 * Everything else stays quiet (principle 2). The word itself comes from the
 * `calendar.lifecycle` namespace, so it is not English-only.
 */

import type { WorkoutState } from "../../../types/calendar-enums";
import type { LifecycleChipTone } from "../CardShell/LifecycleChip";

/** A raw import cannot reach a watch; a stale one no longer matches its plan. */
const ATTENTION_STATES: ReadonlySet<WorkoutState> = new Set<WorkoutState>([
  "raw",
  "stale",
]);

export function lifecycleTone(state: WorkoutState): LifecycleChipTone {
  return ATTENTION_STATES.has(state) ? "attention" : "quiet";
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
