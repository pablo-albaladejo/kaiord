/**
 * Deterministic sport override for coaching-derived KRDs.
 *
 * The LLM convert path may return `generic` even when the source Train2Go
 * sport is known. Once the raw key is resolved to a KRD sport, this stamps
 * it onto both the KRD metadata and the embedded workout so the persisted
 * KRD never carries the model's guess for a known coaching sport.
 */
import type { KRD, Sport, SubSport } from "../../types/schemas";

export type ResolvedSport = { sport: Sport; subSport?: SubSport };

export const forceKrdSport = (krd: KRD, resolved: ResolvedSport): KRD => {
  const workout = krd.extensions?.structured_workout as
    Record<string, unknown> | undefined;
  return {
    ...krd,
    metadata: {
      ...krd.metadata,
      sport: resolved.sport,
      ...(resolved.subSport
        ? { subSport: resolved.subSport }
        : { subSport: undefined }),
    },
    ...(workout
      ? {
          extensions: {
            ...krd.extensions,
            structured_workout: {
              ...workout,
              sport: resolved.sport,
              ...(resolved.subSport ? { subSport: resolved.subSport } : {}),
            },
          },
        }
      : {}),
  };
};

/**
 * Bundle the deterministic sport for a coaching workout: the force-set KRD
 * plus the record `sport`/`subSport`. When the raw key is unmapped
 * (`resolved === null`) the KRD and the raw key pass through unchanged.
 */
export const coachingSportArgs = (
  krd: KRD,
  resolved: ResolvedSport | null,
  rawSport: string
): { krd: KRD; sport: Sport; subSport?: SubSport } =>
  resolved
    ? { krd: forceKrdSport(krd, resolved), ...resolved }
    : { krd, sport: rawSport as Sport };
