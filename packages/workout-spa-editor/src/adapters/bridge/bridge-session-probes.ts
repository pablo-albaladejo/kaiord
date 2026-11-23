/**
 * Per-bridge session probers, keyed by bridgeId.
 *
 * Every entry answers the same question — "does this extension currently
 * hold a live upstream session?" — through whatever action its bridge
 * exposes, and folds transport failures, dead cookie sessions and protocol
 * mismatches into a single `SessionProbeResult` (`classifyEnvelope`). A
 * prober never throws, so one unreachable bridge cannot abort a refresh pass.
 *
 * `tanita-bridge` is deliberately ABSENT: its `checkSession` action is
 * implemented as a full export-CSV download, so polling it would re-fetch
 * the user's entire body-composition history every pass. It joins this map
 * once the extension exposes a cheap session action. Bridges without an
 * entry are reported as discovered-only and are never messaged.
 */
import {
  probeGarminSession,
  probeTrain2GoSession,
  probeTrainingPeaksSession,
  probeWhoopSession,
} from "./bridge-ping-session-probes";
import type { SessionProber } from "./bridge-session-probe-types";

export type { SessionProbeResult } from "./bridge-session-probe-types";

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
