/**
 * Per-bridge session probers, keyed by bridgeId.
 *
 * Every entry answers the same question — "does this extension currently
 * hold a live upstream session?" — through whatever action its bridge
 * exposes, and folds transport failures, dead cookie sessions and protocol
 * mismatches into a single `SessionProbeResult`. A prober never throws, so
 * one unreachable bridge cannot abort a whole refresh pass.
 *
 * `tanita-bridge` is deliberately ABSENT: its `checkSession` action is
 * implemented as a full export-CSV download, so polling it would re-fetch
 * the user's entire body-composition history every pass. It joins this map
 * once the extension exposes a cheap session action. Bridges without an
 * entry are reported as discovered-only and are never messaged.
 */
import { checkTrainingPeaksSession } from "../trainingpeaks/trainingpeaks-transport";
import {
  probeGarminSession,
  probeTrain2GoSession,
} from "./bridge-ping-session-probes";
import {
  active,
  inactive,
  type SessionProber,
} from "./bridge-session-probe-types";
import { readWhoopStatus } from "./whoop-transport";

export type { SessionProbeResult } from "./bridge-session-probe-types";

const messageOf = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

const needsReauthOf = (err: unknown): boolean =>
  (err as { needsReauth?: boolean } | null)?.needsReauth === true;

const probeWhoopSession: SessionProber = async (extensionId) => {
  try {
    const status = await readWhoopStatus(extensionId);
    return status.connected && status.userId !== null ? active() : inactive();
  } catch (err) {
    return inactive(messageOf(err));
  }
};

const probeTrainingPeaksSession: SessionProber = async (extensionId) => {
  try {
    const { authenticated } = await checkTrainingPeaksSession(extensionId);
    return authenticated ? active() : inactive();
  } catch (err) {
    return inactive(messageOf(err), needsReauthOf(err));
  }
};

export const SESSION_PROBES: Record<string, SessionProber> = {
  "garmin-bridge": probeGarminSession,
  "train2go-bridge": probeTrain2GoSession,
  "whoop-bridge": probeWhoopSession,
  "trainingpeaks-bridge": probeTrainingPeaksSession,
};
