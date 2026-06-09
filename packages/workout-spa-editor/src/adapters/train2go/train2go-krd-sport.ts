/**
 * Train2Go → KRD sport resolution (adapter layer).
 *
 * Maps every Train2Go sport identifier onto its KRD `sport` (+ optional
 * `subSport`) so coaching-derived workouts carry their real sport instead
 * of collapsing to `generic`. Lives in `adapters/train2go/` because the
 * key vocabulary is platform-specific; the application layer stays
 * KRD-agnostic and only receives the resolved values.
 *
 * `rest` is intentionally absent (resolves to `null`): a rest day is not a
 * trainable workout, so callers must NOT build a KRD for it.
 */
import type { Sport, SubSport } from "../../types/schemas";

type KrdSport = { sport: Sport; subSport?: SubSport };

export const T2G_SPORT_TO_KRD: Record<string, KrdSport> = {
  cycling: { sport: "cycling" },
  running: { sport: "running" },
  swimming: { sport: "swimming" },
  gym: { sport: "training", subSport: "strength_training" },
  stretching: { sport: "training", subSport: "flexibility_training" },
  yoga: { sport: "training", subSport: "yoga" },
  pilates: { sport: "training", subSport: "pilates" },
  cardio: { sport: "training", subSport: "cardio_training" },
  rowing: { sport: "rowing", subSport: "indoor_rowing" },
  indoorrowing: { sport: "rowing", subSport: "indoor_rowing" },
  walk: { sport: "walking" },
  mountainwalk: { sport: "hiking" },
  trail: { sport: "running", subSport: "trail" },
  sprint: { sport: "running" },
  mountainbike: { sport: "cycling", subSport: "mountain" },
  stationarybike: { sport: "cycling", subSport: "indoor_cycling" },
  climbing: { sport: "rock_climbing" },
  ski: { sport: "alpine_skiing" },
  mountainski: { sport: "cross_country_skiing" },
  tennis: { sport: "tennis" },
  canicross: { sport: "running" },
  canibike: { sport: "cycling" },
  dog: { sport: "generic" },
};

/**
 * Resolve a raw Train2Go sport key to its KRD sport (+ optional subSport).
 * Returns `null` for `rest` (no trainable workout) and for unknown keys.
 */
export const resolveT2GSport = (rawKey: string): KrdSport | null => {
  if (!rawKey) return null;
  return T2G_SPORT_TO_KRD[rawKey.toLowerCase()] ?? null;
};
