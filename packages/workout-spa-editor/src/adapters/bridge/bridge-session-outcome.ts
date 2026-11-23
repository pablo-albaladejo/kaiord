/**
 * The typed outcome an extension answers to a Session check.
 *
 * A check never downloads the athlete's data and never mints a token, so it
 * can come back four ways: the Platform said the Session works, the Platform
 * said it ended (the only verified "signed out"), the Platform did not
 * answer, or nothing was asked because the only request that could tell
 * would mint a token. An extension older than this contract answers no
 * `session`, and its own booleans are read instead.
 */
import { z } from "zod";

import {
  active,
  inactive,
  notChecked,
  type SessionProbeResult,
} from "./bridge-session-probe-types";

export const SESSION_OUTCOMES = [
  "signed-in",
  "signed-out",
  "not-answering",
  "not-checked",
] as const;

export type SessionOutcome = (typeof SESSION_OUTCOMES)[number];

const outcomeSchema = z.object({ session: z.enum(SESSION_OUTCOMES) });

/** The outcome, or `null` when an older extension answered without one. */
export const sessionOutcomeOf = (data: unknown): SessionOutcome | null => {
  const parsed = outcomeSchema.safeParse(data);
  return parsed.success ? parsed.data.session : null;
};

const NOT_ANSWERING = "The Platform did not answer the Session check";

export const probeResultOf = (outcome: SessionOutcome): SessionProbeResult => {
  switch (outcome) {
    case "signed-in":
      return active();
    case "signed-out":
      return inactive(null, true);
    case "not-answering":
      return inactive(NOT_ANSWERING);
    case "not-checked":
      return notChecked();
  }
};

/** Whether a real read or send may go ahead: only a verified sign-out or a
    Platform that did not answer stops it; "not-checked" is decided by the
    use itself. */
export const sessionMayBeUsed = (outcome: SessionOutcome): boolean =>
  outcome === "signed-in" || outcome === "not-checked";

/** The same decision for a whole check answer, reading an older extension's
    `authenticated` when it sends no outcome. */
export const checkAllowsUse = (answer: {
  session?: SessionOutcome;
  authenticated: boolean;
}): boolean =>
  answer.session !== undefined
    ? sessionMayBeUsed(answer.session)
    : answer.authenticated;
