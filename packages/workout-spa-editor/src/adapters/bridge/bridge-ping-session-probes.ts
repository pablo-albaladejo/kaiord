/**
 * Session probers: one message to the extension, one typed answer.
 *
 * Every prober reads the envelope the same way. The protocol version comes
 * first, from the envelope itself, so an outdated extension is recognised as
 * outdated on every bridge — whatever action it answers, and even when that
 * action fails — instead of looking like a signed-out Session. Only then is
 * the session read, through the one adapter over today's answers
 * (`application/connections/session-outcome`).
 *
 * The readers are replicated from nothing in `store/` or `hooks/`: the SPA
 * boundary rules forbid `adapters/**` importing either, and these probers stay
 * side-effect free (they only report).
 */
import {
  readFailedEnvelope,
  readGarminSession,
  readTrain2GoSession,
  readTrainingPeaksSession,
  readWhoopSession,
  type SessionOutcome,
} from "../../application/connections/session-outcome";
import {
  active,
  inactive,
  outdatedExtension,
  type SessionProber,
  type SessionProbeResult,
  unreachable,
} from "./bridge-session-probe-types";
import { type ExtensionResponse, sendBridgeMessage } from "./bridge-transport";

export const SUPPORTED_PROTOCOL_VERSION = 1;

const PING_TIMEOUT_MS = 2_000;
const STATUS_TIMEOUT_MS = 5_000;

const fromOutcome = (
  outcome: SessionOutcome,
  error: string | null = null
): SessionProbeResult => {
  if (outcome === "signed-in") return active();
  return inactive(error, outcome === "signed-out-verified");
};

/** The whole classification of one answer, exported for the message-contract
    tests: delivery, then protocol, then the session. */
export const classifyEnvelope = (
  res: ExtensionResponse,
  readSession: (data: unknown) => SessionOutcome
): SessionProbeResult => {
  if (res.delivered === false) return unreachable(res.error ?? null);
  if (res.protocolVersion !== SUPPORTED_PROTOCOL_VERSION) {
    return outdatedExtension("unsupported protocol version");
  }
  if (!res.ok) {
    return fromOutcome(
      readFailedEnvelope(res.needsReauth === true),
      res.error ?? null
    );
  }
  return fromOutcome(readSession(res.data));
};

const probeBy =
  (
    action: string,
    timeoutMs: number,
    readSession: (data: unknown) => SessionOutcome
  ): SessionProber =>
  async (extensionId) =>
    classifyEnvelope(
      await sendBridgeMessage(extensionId, { action }, timeoutMs),
      readSession
    );

export const probeGarminSession = probeBy(
  "ping",
  PING_TIMEOUT_MS,
  readGarminSession
);

export const probeTrain2GoSession = probeBy(
  "ping",
  PING_TIMEOUT_MS,
  readTrain2GoSession
);

export const probeTrainingPeaksSession = probeBy(
  "checkSession",
  STATUS_TIMEOUT_MS,
  readTrainingPeaksSession
);

export const probeWhoopSession = probeBy(
  "status",
  STATUS_TIMEOUT_MS,
  readWhoopSession
);
