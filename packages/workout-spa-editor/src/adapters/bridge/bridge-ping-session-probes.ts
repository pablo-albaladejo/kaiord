/**
 * Session probers: one message to the extension, one typed answer.
 *
 * Every prober reads the envelope the same way. The protocol version comes
 * first, from the envelope itself, so an outdated extension is recognised as
 * outdated on every bridge — whatever action it answers, and even when that
 * action fails — instead of looking like a signed-out Session. Then the
 * typed outcome an extension with the cheap check answers
 * (`bridge-session-outcome`); an older extension is read through the one
 * adapter over its own booleans (`application/connections/session-outcome`).
 *
 * The readers are replicated from nothing in `store/` or `hooks/`: the SPA
 * boundary rules forbid `adapters/**` importing either, and these probers stay
 * side-effect free (they only report).
 */
import {
  readGarminSession,
  readTrain2GoSession,
  readTrainingPeaksSession,
  readWhoopSession,
  type SessionOutcome,
} from "../../application/connections/session-outcome";
import { classifyEnvelope } from "./bridge-envelope-classify";
import type { SessionProber } from "./bridge-session-probe-types";
import { sendBridgeMessage } from "./bridge-transport";

const PING_TIMEOUT_MS = 2_000;
const STATUS_TIMEOUT_MS = 5_000;

const probeBy =
  (
    bridgeId: string,
    action: string,
    timeoutMs: number,
    readSession: (data: unknown) => SessionOutcome
  ): SessionProber =>
  async (extensionId) =>
    classifyEnvelope(
      await sendBridgeMessage(extensionId, { action }, timeoutMs),
      bridgeId,
      readSession
    );

export const probeGarminSession = probeBy(
  "garmin-bridge",
  "ping",
  PING_TIMEOUT_MS,
  readGarminSession
);

export const probeTrain2GoSession = probeBy(
  "train2go-bridge",
  "ping",
  PING_TIMEOUT_MS,
  readTrain2GoSession
);

export const probeTrainingPeaksSession = probeBy(
  "trainingpeaks-bridge",
  "checkSession",
  STATUS_TIMEOUT_MS,
  readTrainingPeaksSession
);

export const probeWhoopSession = probeBy(
  "whoop-bridge",
  "status",
  STATUS_TIMEOUT_MS,
  readWhoopSession
);
