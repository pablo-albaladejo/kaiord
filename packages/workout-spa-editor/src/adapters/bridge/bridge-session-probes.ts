/**
 * Per-bridge session probers, keyed by bridgeId.
 *
 * Every entry answers the same question — "does this extension currently
 * hold a live upstream session?" — through whatever action its bridge
 * exposes, and folds transport failures, dead cookie sessions and protocol
 * mismatches into a single `SessionProbeResult` (`classifyEnvelope`). A
 * prober never throws, so one unreachable bridge cannot abort a refresh pass.
 *
 * An extension that answers the typed `session` outcome is read through it
 * (`bridge-session-outcome`); an older one through its own booleans. A
 * prober is handed the protocol version discovery verified, and asks an
 * extension one protocol behind nothing when its check would cost data or a
 * token (`bridge-ping-session-probes`).
 */
import {
  probeGarminSession,
  probeTanitaSession,
  probeTrain2GoSession,
  probeTrainingPeaksSession,
  probeWhoopSession,
} from "./bridge-ping-session-probes";
import type { SessionProber } from "./bridge-session-probe-types";

export type { SessionProbeResult } from "./bridge-session-probe-types";

export const SESSION_PROBES: Record<string, SessionProber> = {
  "garmin-bridge": probeGarminSession,
  "tanita-bridge": probeTanitaSession,
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
