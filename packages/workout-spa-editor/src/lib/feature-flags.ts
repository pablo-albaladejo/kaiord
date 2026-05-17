/**
 * Feature flags scaffold for the UX 2026 redesign roadmap.
 *
 * Flags are compile-time constants today (single source of truth in
 * this file). A later iteration may switch the lookup to read from
 * env, Dexie, or a remote config; the public hook signature is the
 * one to keep stable.
 *
 * Roadmap reference: `.omc/specs/deep-dive-ui-flow-map-ux-redesign.md`.
 */

export const FEATURE_FLAGS = {
  /** Phase 2: persistent status header with profile / Garmin / sync state. */
  "ux2026.spineHeader": false,
  /** Phase 3: single CreateWorkoutSheet entry-point (manual / AI / template). */
  "ux2026.unifiedCreate": false,
  /** Phase 3: drag-and-drop scheduling from library to calendar. */
  "ux2026.dragSchedule": false,
  /** Phase 3: "Polish with AI" toolbar action in the editor. */
  "ux2026.polishWithAi": false,
  /** Phase 4: completion color-coding on calendar cells. */
  "ux2026.calendarCompletion": false,
  /** Phase 4: weekly summary strip on the calendar. */
  "ux2026.weeklySummary": false,
  /** Phase 5: command palette (Cmd-K). */
  "ux2026.commandPalette": false,
  /** Phase 2: read-only zone peek shortcut. */
  "ux2026.zonePeek": false,
  /** Phase 2: unified /settings route with deep-linkable tabs. */
  "ux2026.unifiedSettings": false,
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

export function useFeatureFlag(name: FeatureFlagName): boolean {
  return FEATURE_FLAGS[name];
}

export function isFeatureFlagEnabled(name: FeatureFlagName): boolean {
  return FEATURE_FLAGS[name];
}
