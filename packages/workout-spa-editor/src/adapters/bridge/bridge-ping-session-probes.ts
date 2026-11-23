/**
 * Session probers: one message to the extension, one typed answer.
 *
 * Every prober reads the envelope the same way. The protocol version comes
 * first, from the envelope itself, so an outdated extension is recognised as
 * outdated on every bridge — whatever action it answers, and even when that
 * action fails — instead of looking like a signed-out Session. Then the
 * typed outcome an extension with the cheap check answers
 * (`bridge-session-outcome`); an older extension is read through its own
 * booleans (`bridge-legacy-session-readers`).
 *
 * A check never downloads data and never mints a token (ADR 0004). An
 * extension one protocol behind answers Garmin's `ping` with a read of one
 * workout, TrainingPeaks' `checkSession` by minting a token and Tanita's by
 * downloading the export, so those three are asked nothing when discovery
 * verified protocol 1: their check is "not checked".
 */
import type { SessionOutcome } from "../../application/connections/session-outcome";
import { classifyEnvelope } from "./bridge-envelope-classify";
import {
  readGarminSession,
  readTanitaSession,
  readTrain2GoSession,
  readTrainingPeaksSession,
} from "./bridge-legacy-session-readers";
import { notChecked, type SessionProber } from "./bridge-session-probe-types";
import { sendBridgeMessage } from "./bridge-transport";
import { PREVIOUS_BRIDGE_PROTOCOL_VERSION } from "./thin-bridge-request";

const PING_TIMEOUT_MS = 2_000;
const STATUS_TIMEOUT_MS = 5_000;

type Probe = {
  bridgeId: string;
  action: string;
  timeoutMs: number;
  readSession: (data: unknown) => SessionOutcome;
  /** The previous protocol's check reads data or mints a token. */
  costlyOnPrevious?: true;
};

const probeBy =
  ({ bridgeId, action, timeoutMs, readSession, costlyOnPrevious }: Probe) =>
  async (
    extensionId: string,
    protocolVersion?: number | null
  ): ReturnType<SessionProber> => {
    if (
      costlyOnPrevious &&
      protocolVersion === PREVIOUS_BRIDGE_PROTOCOL_VERSION
    )
      return notChecked();
    const res = await sendBridgeMessage(extensionId, { action }, timeoutMs);
    return classifyEnvelope(res, bridgeId, readSession);
  };

export const probeGarminSession = probeBy({
  bridgeId: "garmin-bridge",
  action: "ping",
  timeoutMs: PING_TIMEOUT_MS,
  readSession: readGarminSession,
  costlyOnPrevious: true,
});

export const probeTrain2GoSession = probeBy({
  bridgeId: "train2go-bridge",
  action: "ping",
  timeoutMs: PING_TIMEOUT_MS,
  readSession: readTrain2GoSession,
});

export const probeTrainingPeaksSession = probeBy({
  bridgeId: "trainingpeaks-bridge",
  action: "checkSession",
  timeoutMs: STATUS_TIMEOUT_MS,
  readSession: readTrainingPeaksSession,
  costlyOnPrevious: true,
});

export const probeTanitaSession = probeBy({
  bridgeId: "tanita-bridge",
  action: "checkSession",
  timeoutMs: STATUS_TIMEOUT_MS,
  readSession: readTanitaSession,
  costlyOnPrevious: true,
});
