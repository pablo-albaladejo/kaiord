/**
 * Per-bridge session probers, keyed by bridgeId.
 *
 * Every entry answers the same question — "does this extension currently
 * hold a live upstream session?" — through whatever action its bridge
 * exposes, and folds transport failures, dead cookie sessions and protocol
 * mismatches into a single `SessionProbeResult`. A prober never throws, so
 * one unreachable bridge cannot abort a whole refresh pass.
 *
 * An extension that answers the typed `session` outcome is read through it
 * (`bridge-session-outcome`); an older one through its own booleans.
 *
 * `tanita-bridge` is deliberately ABSENT: an extension older than the cheap
 * check implements `checkSession` as a full export-CSV download, and the App
 * cannot tell which one is installed before asking, so polling it could
 * re-fetch the athlete's entire body-composition history every pass. Bridges
 * without an entry are reported as discovered-only and are never messaged.
 */
import { errorMessage } from "../../utils/error-message";
import { checkTrainingPeaksSession } from "../trainingpeaks/trainingpeaks-transport";
import {
  probeGarminSession,
  probeTrain2GoSession,
} from "./bridge-ping-session-probes";
import { probeResultOf } from "./bridge-session-outcome";
import {
  active,
  inactive,
  type SessionProber,
  unreachable,
} from "./bridge-session-probe-types";
import { readWhoopStatus } from "./whoop-transport";

export type { SessionProbeResult } from "./bridge-session-probe-types";

const needsReauthOf = (err: unknown): boolean =>
  (err as { needsReauth?: boolean } | null)?.needsReauth === true;

/** Both transports stamp `delivered` on their typed error, mirroring how
    TrainingPeaks already rides `needsReauth` out to the caller. */
const wasDelivered = (err: unknown): boolean =>
  (err as { delivered?: boolean } | null)?.delivered !== false;

const probeWhoopSession: SessionProber = async (extensionId) => {
  try {
    const status = await readWhoopStatus(extensionId);
    if (status.session !== undefined) return probeResultOf(status.session);
    return status.connected && status.userId !== null ? active() : inactive();
  } catch (err) {
    return wasDelivered(err)
      ? inactive(errorMessage(err))
      : unreachable(errorMessage(err));
  }
};

const probeTrainingPeaksSession: SessionProber = async (extensionId) => {
  try {
    const { authenticated, session } =
      await checkTrainingPeaksSession(extensionId);
    if (session !== undefined) return probeResultOf(session);
    return authenticated ? active() : inactive();
  } catch (err) {
    return wasDelivered(err)
      ? inactive(errorMessage(err), needsReauthOf(err))
      : unreachable(errorMessage(err));
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
