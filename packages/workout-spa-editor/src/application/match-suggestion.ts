/**
 * MatchSuggestion — the contract between the auto-match heuristic
 * (producer) and the suggestion banner (consumer). This module is the
 * canonical home for the type; redeclarations elsewhere are forbidden
 * and SHALL be caught by the eslint guardrail in tasks.md 12.4.
 *
 * `score: null` encodes "duration unknown" and is rendered via the
 * `neutral` bucket — never substituted to 0.5 (which would collide
 * with the `mid` bucket, falsely equating "we don't know" with
 * "you're at 50%").
 */

export type MatchSuggestionReason =
  | { code: "duration-match"; deltaSeconds: number }
  | { code: "duration-unknown" }
  | { code: "sport-family-match"; family: string };

export type MatchSuggestion = {
  activityId: string;
  workoutId: string;
  /** [0, 1] for parsed durations; null for duration-unknown candidates. */
  score: number | null;
  /** Never empty; reasons[0] is always the sport-family-match precondition. */
  reasons: MatchSuggestionReason[];
};
