/**
 * What a Session check established, read from today's bridge answers.
 *
 * This file is the one adapter between the answers the extensions give now and
 * the typed outcome the rest of the App consumes. When the extensions report
 * the outcome themselves (signed-in / signed-out-verified / could-not-tell),
 * each reader below becomes a field read and nothing downstream changes.
 *
 * "signed-out-verified" means the Platform itself said the sign-in is gone (a
 * redirect, a 401/403, or an extension that holds no sign-in to lend). Every
 * other failure is "could-not-tell": a Platform that is down answers the same
 * way as one that refused, so no cause may be stated for it.
 */

export type SessionOutcome =
  "signed-in" | "signed-out-verified" | "could-not-tell";

type Data = Record<string, unknown> | undefined;

const field = (data: unknown, key: string): unknown => (data as Data)?.[key];

const fromFlags = (
  signedIn: boolean,
  refusedByPlatform: boolean
): SessionOutcome => {
  if (signedIn) return "signed-in";
  return refusedByPlatform ? "signed-out-verified" : "could-not-tell";
};

/** Garmin's `ping`: `gcApi` is the result of one cheap read. A failed read is
    no evidence about the sign-in, because Garmin being down explains it too. */
export const readGarminSession = (data: unknown): SessionOutcome => {
  const gcApi = field(data, "gcApi");
  return fromFlags(
    field(gcApi, "ok") === true,
    field(gcApi, "needsReauth") === true
  );
};

/** Train2Go's `ping` folds an outage into `sessionActive: false`, so only an
    explicit refusal may become "signed-out-verified". */
export const readTrain2GoSession = (data: unknown): SessionOutcome =>
  fromFlags(
    field(data, "sessionActive") === true,
    field(data, "needsReauth") === true
  );

/** TrainingPeaks' `checkSession` says whether TrainingPeaks refused the
    sign-in (`needsReauth`) or merely failed to answer. */
export const readTrainingPeaksSession = (data: unknown): SessionOutcome =>
  fromFlags(
    field(data, "authenticated") === true,
    field(data, "needsReauth") === true
  );

/** WHOOP's `status`: `connected` says the extension holds a WHOOP sign-in.
    Read exactly as the WHOOP popup reads it, so the two never disagree. */
export const readWhoopSession = (data: unknown): SessionOutcome =>
  field(data, "connected") === true ? "signed-in" : "signed-out-verified";

/** A delivered `ok: false` envelope: refused only if it carries the flag. */
export const readFailedEnvelope = (needsReauth: boolean): SessionOutcome =>
  needsReauth ? "signed-out-verified" : "could-not-tell";
