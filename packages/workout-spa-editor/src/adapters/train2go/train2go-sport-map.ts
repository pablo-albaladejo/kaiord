/**
 * Train2Go Sport Map — Adapter-level mapping.
 *
 * Maps Train2Go sport identifiers to a neutral `{ id, icon }`: the id is a
 * known Train2Go sport or `activity`, and the presentation layer words it
 * from `coaching:sport.<id>`. This file lives in adapters/ because it is
 * platform-specific.
 */

import type { CoachingSport } from "../../types/coaching-activity";

const SPORT_ICONS: Record<string, string> = {
  cycling: "\u{1F6B4}",
  running: "\u{1F3C3}",
  swimming: "\u{1F3CA}",
  gym: "\u{1F3CB}\u{FE0F}",
  stretching: "\u{1F9D8}",
  yoga: "\u{1F9D8}",
  pilates: "\u{1F9D8}",
  rest: "\u{1F634}",
  walk: "\u{1F6B6}",
  mountainwalk: "\u{1F97E}",
  trail: "\u{1F97E}",
  mountainbike: "\u{1F6B5}",
  stationarybike: "\u{1F6B4}",
  rowing: "\u{1F6A3}",
  indoorrowing: "\u{1F6A3}",
  climbing: "\u{1F9D7}",
  ski: "\u{26F7}\u{FE0F}",
  mountainski: "\u{26F7}\u{FE0F}",
  sprint: "\u{1F3C3}",
  tennis: "\u{1F3BE}",
  cardio: "\u{1F4AA}",
  canicross: "\u{1F415}",
  canibike: "\u{1F415}",
  dog: "\u{1F415}",
};

const FALLBACK = "activity";
const FALLBACK_ICON = "\u{1F4AA}";

export const getT2GSportDisplay = (sport: string): CoachingSport => {
  const id = sport?.toLowerCase();
  const icon = id ? SPORT_ICONS[id] : undefined;
  if (!id || !icon) return { id: FALLBACK, icon: FALLBACK_ICON };
  return { id, icon };
};
