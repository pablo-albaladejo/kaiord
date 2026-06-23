/**
 * Curated MET (metabolic-equivalent) reference table keyed on kaiord's `Sport`
 * enum. Pure; no adapter/external deps.
 *
 * SCOPING DECISION: rather than vendoring an ~800-row Compendium of Physical
 * Activities (which would force an impossible 800-code → kaiord-`Sport` mapping
 * and raise dataset-licensing questions), this is a small CURATED record of
 * standard, factual MET values covering the sports kaiord actually models. The
 * spec's MET-fallback intent is honoured; the table is trivially extensible —
 * add a `Sport` key with its reference MET. Any sport not listed falls back to
 * {@link DEFAULT_MET}, a moderate-effort placeholder.
 *
 * MET values are reference figures for moderate-to-vigorous effort, drawn from
 * standard activity-energy literature.
 */

import type { Sport } from "../../domain/schemas/sport";

/** Fallback MET for any `Sport` not present in {@link MET_TABLE}. */
export const DEFAULT_MET = 6.0;

/**
 * Standard MET values per sport. Partial by design: unmapped sports resolve to
 * {@link DEFAULT_MET}. Extend by adding the sport key with its reference MET.
 */
export const MET_TABLE: Partial<Record<Sport, number>> = {
  running: 9.8,
  cycling: 8.0,
  e_biking: 5.0,
  swimming: 7.0,
  walking: 3.5,
  hiking: 6.0,
  rowing: 7.0,
  training: 5.0,
  fitness_equipment: 5.0,
  hiit: 8.0,
  cross_country_skiing: 9.0,
  alpine_skiing: 6.0,
  snowboarding: 5.3,
  snowshoeing: 7.5,
  inline_skating: 7.5,
  ice_skating: 7.0,
  mountaineering: 8.0,
  rock_climbing: 8.0,
  floor_climbing: 8.0,
  paddling: 5.0,
  kayaking: 5.0,
  canoeing: 5.0,
  stand_up_paddleboarding: 6.0,
  surfing: 5.0,
  windsurfing: 5.0,
  kitesurfing: 8.0,
  sailing: 3.0,
  tennis: 7.3,
  racket: 7.0,
  basketball: 6.5,
  soccer: 7.0,
  volleyball: 4.0,
  boxing: 9.0,
  mixed_martial_arts: 10.0,
  dance: 5.0,
  jump_rope: 11.0,
  golf: 4.8,
  disc_golf: 4.0,
  horseback_riding: 5.5,
  mobility: 2.5,
  meditation: 1.3,
};

/**
 * Resolve a sport's MET value, falling back to {@link DEFAULT_MET} for any
 * sport absent from {@link MET_TABLE}.
 */
export const metForSport = (sport: Sport): number =>
  MET_TABLE[sport] ?? DEFAULT_MET;
