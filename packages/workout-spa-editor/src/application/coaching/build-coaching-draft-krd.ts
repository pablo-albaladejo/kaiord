/**
 * buildCoachingDraftKrd — derive the seed KRD for a coaching draft.
 *
 * Resolves the Train2Go sport and materialises the 1-step warmup
 * template KRD used to seed the editor at draft ENTRY (mirrors the
 * scratch flow's `createEmptyWorkout`). Returns `null` for a rest day
 * or unknown sport (`resolveT2GSport === null`) so the caller can show
 * the no-structured-workout state instead of a misleading template.
 *
 * The resolved sport/subSport are also returned so the Save path can
 * persist a deterministic `record.sport` via `buildStructuredCoachingWorkout`.
 */
import { resolveT2GSport } from "../../adapters/train2go/train2go-krd-sport";
import type { Sport, SubSport } from "../../types/schemas";
import { buildCoachingTemplateKrd } from "./coaching-template";
import type { CoachingActivityForConvert } from "./convert-coaching-activity-manual-types";

export type CoachingDraft = {
  krd: ReturnType<typeof buildCoachingTemplateKrd>;
  sport: Sport;
  subSport?: SubSport;
};

export const buildCoachingDraftKrd = (
  activity: CoachingActivityForConvert
): CoachingDraft | null => {
  const resolved = resolveT2GSport(activity.sport);
  if (!resolved) return null;
  return {
    krd: buildCoachingTemplateKrd(
      resolved.sport,
      activity.title,
      resolved.subSport
    ),
    sport: resolved.sport,
    subSport: resolved.subSport,
  };
};
