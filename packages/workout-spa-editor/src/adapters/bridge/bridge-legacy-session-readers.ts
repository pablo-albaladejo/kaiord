/**
 * An extension older than the typed `session` outcome answers its own
 * booleans; these read them into the one outcome. "signed-out" only where
 * the extension flags the Platform's refusal (`needsReauth`): a failed read
 * is no evidence about the sign-in, because a Platform that is down answers
 * the same way, so it is "not-answering".
 */
import type { SessionOutcome } from "../../application/connections/session-outcome";

type Data = Record<string, unknown> | undefined;

const field = (data: unknown, key: string): unknown => (data as Data)?.[key];

const fromFlags = (
  signedIn: boolean,
  refusedByPlatform: boolean
): SessionOutcome => {
  if (signedIn) return "signed-in";
  return refusedByPlatform ? "signed-out" : "not-answering";
};

/** Garmin's `ping`: `gcApi` is the result of one read. */
export const readGarminSession = (data: unknown): SessionOutcome => {
  const gcApi = field(data, "gcApi");
  return fromFlags(
    field(gcApi, "ok") === true,
    field(gcApi, "needsReauth") === true
  );
};

/** Train2Go's `ping` folds an outage into `sessionActive: false`. */
export const readTrain2GoSession = (data: unknown): SessionOutcome =>
  fromFlags(
    field(data, "sessionActive") === true,
    field(data, "needsReauth") === true
  );

/** TrainingPeaks' `checkSession`. */
export const readTrainingPeaksSession = (data: unknown): SessionOutcome =>
  fromFlags(
    field(data, "authenticated") === true,
    field(data, "needsReauth") === true
  );

/** Tanita's check: its `authenticated` and nothing else that says why. */
export const readTanitaSession = (data: unknown): SessionOutcome =>
  fromFlags(field(data, "authenticated") === true, false);

/** WHOOP's `status`: `connected` says it holds a WHOOP sign-in. Holding none
    is not the Platform's refusal (a newer extension answers "not-checked"). */
export const readWhoopSession = (data: unknown): SessionOutcome =>
  fromFlags(field(data, "connected") === true, false);

/** A delivered `ok: false` envelope: refused only if it carries the flag. */
export const readFailedEnvelope = (needsReauth: boolean): SessionOutcome =>
  needsReauth ? "signed-out" : "not-answering";
