/**
 * Train2Go Sport Map — Adapter-level mapping.
 *
 * Maps Train2Go sport identifiers to generic { label, icon } display.
 * This file lives in adapters/ because it is platform-specific.
 */

type SportDisplay = { label: string; icon: string };

const SPORT_MAP: Record<string, SportDisplay> = {
  cycling: { label: "Cycling", icon: "\u{1F6B4}" },
  running: { label: "Running", icon: "\u{1F3C3}" },
  swimming: { label: "Swimming", icon: "\u{1F3CA}" },
  gym: { label: "Gym", icon: "\u{1F3CB}\u{FE0F}" },
  stretching: { label: "Stretching", icon: "\u{1F9D8}" },
  yoga: { label: "Yoga", icon: "\u{1F9D8}" },
  pilates: { label: "Pilates", icon: "\u{1F9D8}" },
  rest: { label: "Rest", icon: "\u{1F634}" },
  walk: { label: "Walk", icon: "\u{1F6B6}" },
  mountainwalk: { label: "Hiking", icon: "\u{1F97E}" },
  trail: { label: "Trail", icon: "\u{1F97E}" },
  mountainbike: { label: "MTB", icon: "\u{1F6B5}" },
  stationarybike: { label: "Indoor Bike", icon: "\u{1F6B4}" },
  rowing: { label: "Rowing", icon: "\u{1F6A3}" },
  indoorrowing: { label: "Indoor Rowing", icon: "\u{1F6A3}" },
  climbing: { label: "Climbing", icon: "\u{1F9D7}" },
  ski: { label: "Ski", icon: "\u{26F7}\u{FE0F}" },
  mountainski: { label: "Ski Touring", icon: "\u{26F7}\u{FE0F}" },
  sprint: { label: "Sprint", icon: "\u{1F3C3}" },
  tennis: { label: "Tennis", icon: "\u{1F3BE}" },
  cardio: { label: "Cardio", icon: "\u{1F4AA}" },
  canicross: { label: "Canicross", icon: "\u{1F415}" },
  canibike: { label: "Canibike", icon: "\u{1F415}" },
  dog: { label: "Dog Sport", icon: "\u{1F415}" },
};

const FALLBACK: SportDisplay = { label: "Activity", icon: "\u{1F4AA}" };

export const getT2GSportDisplay = (sport: string): SportDisplay =>
  SPORT_MAP[sport?.toLowerCase()] ?? FALLBACK;
