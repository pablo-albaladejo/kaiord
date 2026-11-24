/**
 * What a Session check established, in the one vocabulary every layer
 * speaks: the Platform said the Session works, the Platform said it ended
 * (the only verified "signed out"), the Platform did not answer, or nothing
 * was asked because the only request that could tell would cost data or a
 * token. Reading it from an extension's answer is the adapter's job
 * (`adapters/bridge/bridge-session-outcome`); this layer sees only the
 * outcome.
 */
export const SESSION_OUTCOMES = [
  "signed-in",
  "signed-out",
  "not-answering",
  "not-checked",
] as const;

export type SessionOutcome = (typeof SESSION_OUTCOMES)[number];
