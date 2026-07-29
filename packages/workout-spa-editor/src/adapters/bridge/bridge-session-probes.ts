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
  unreachable,
} from "./bridge-session-probe-types";
import { readWhoopStatus } from "./whoop-transport";

export type { SessionProbeResult } from "./bridge-session-probe-types";

const messageOf = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

const needsReauthOf = (err: unknown): boolean =>
  (err as { needsReauth?: boolean } | null)?.needsReauth === true;

/** Both transports stamp `delivered` on their typed error, mirroring how
    TrainingPeaks already rides `needsReauth` out to the caller. */
const wasDelivered = (err: unknown): boolean =>
  (err as { delivered?: boolean } | null)?.delivered !== false;

const probeWhoopSession: SessionProber = async (extensionId) => {
  try {
    const status = await readWhoopStatus(extensionId);
    return status.connected && status.userId !== null ? active() : inactive();
  } catch (err) {
    return wasDelivered(err)
      ? inactive(messageOf(err))
      : unreachable(messageOf(err));
  }
};

const probeTrainingPeaksSession: SessionProber = async (extensionId) => {
  try {
    const { authenticated } = await checkTrainingPeaksSession(extensionId);
    return authenticated ? active() : inactive();
  } catch (err) {
    return wasDelivered(err)
      ? inactive(messageOf(err), needsReauthOf(err))
      : unreachable(messageOf(err));
  }
};

export const SESSION_PROBES: Record<string, SessionProber> = {
  "garmin-bridge": probeGarminSession,
  "train2go-bridge": probeTrain2GoSession,
  "whoop-bridge": probeWhoopSession,
  "trainingpeaks-bridge": probeTrainingPeaksSession,
};

/** Whether a bridge has a session prober at all. The Connections page needs
    the fact itself: a bridge without one can never report a live session, and
    inferring that from runtime state mislabels a probed bridge whose extension
    id changed mid-probe. */
export const hasSessionProbe = (bridgeId: string): boolean =>
  SESSION_PROBES[bridgeId] !== undefined;
