/**
 * Healing use case for orphan `sessionMatches` rows whose
 * `coachingActivityId` was persisted in the legacy SHORT form
 * (`"${source}:${sourceId}"`) by `useCoachingAutoHeal` /
 * `handleSelectWorkout` before the H7 fix. See
 * `.omc/autopilot/bug-trace.md` §H7 + §H8.
 *
 * Pure application use case — no Dexie imports, every IO goes through
 * the injected ports. Idempotent: a no-op when the match's
 * `coachingActivityId` already resolves to a `coachingActivities` row.
 */

import type { SessionMatch } from "../../types/session-match";
import { logger } from "../../utils/logger";
import { resolveCanonicalActivityId } from "./heal-session-match-id-shape-helpers";
import type {
  HealOutcome,
  HealSessionMatchIdShapeDeps,
  HealSessionMatchIdShapeInput,
} from "./heal-session-match-id-shape-types";

export type {
  HealOutcome,
  HealSessionMatchIdShapeDeps,
  HealSessionMatchIdShapeInput,
} from "./heal-session-match-id-shape-types";

const dropOrphan = async (
  match: SessionMatch,
  composite: string,
  canonicalMatchId: string,
  deps: HealSessionMatchIdShapeDeps
): Promise<HealOutcome> => {
  await deps.sessionMatches.delete(match.id);
  logger.info("[heal] session-match orphan dropped", {
    matchId: match.id,
    canonicalMatchId,
    from: match.coachingActivityId,
    to: composite,
  });
  return {
    kind: "deleted-orphan",
    orphanMatchId: match.id,
    canonicalMatchId,
  };
};

const rewriteIdShape = async (
  match: SessionMatch,
  composite: string,
  deps: HealSessionMatchIdShapeDeps
): Promise<HealOutcome> => {
  await deps.sessionMatches.updateCoachingActivityId(match.id, composite);
  logger.info("[heal] session-match id-shape rewritten", {
    matchId: match.id,
    from: match.coachingActivityId,
    to: composite,
  });
  return { kind: "healed", from: match.coachingActivityId, to: composite };
};

export const healSessionMatchIdShape = async (
  input: HealSessionMatchIdShapeInput,
  deps: HealSessionMatchIdShapeDeps
): Promise<HealOutcome> => {
  const { match } = input;
  const direct = await deps.coaching.getById(match.coachingActivityId);
  if (direct) return { kind: "noop", reason: "already-composite" };

  const composite = await resolveCanonicalActivityId(match, deps);
  if (!composite) return { kind: "noop", reason: "no-workout" };
  const canonicalActivity = await deps.coaching.getById(composite);
  if (!canonicalActivity) return { kind: "noop", reason: "no-activity" };

  const canonicalMatch = await deps.sessionMatches.getByActivityId(
    match.profileId,
    composite
  );
  if (canonicalMatch && canonicalMatch.id !== match.id) {
    return dropOrphan(match, composite, canonicalMatch.id, deps);
  }
  return rewriteIdShape(match, composite, deps);
};
