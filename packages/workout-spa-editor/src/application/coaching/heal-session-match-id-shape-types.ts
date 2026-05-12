/**
 * Type surface for `healSessionMatchIdShape`. Extracted so the use case
 * file stays under the per-file/per-function line caps.
 */

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { SessionMatch } from "../../types/session-match";

export type HealSessionMatchIdShapeInput = {
  match: SessionMatch;
};

export type HealSessionMatchIdShapeDeps = {
  coaching: CoachingRepository;
  workouts: WorkoutRepository;
  sessionMatches: SessionMatchRepository;
};

export type HealOutcome =
  | { kind: "noop"; reason: "already-composite" | "no-activity" | "no-workout" }
  | { kind: "healed"; from: string; to: string }
  | { kind: "deleted-orphan"; orphanMatchId: string; canonicalMatchId: string };
