/**
 * The classification of one Session-check answer: delivery, then the
 * protocol version from the envelope, then the typed outcome an extension
 * with the cheap check answers, then an older extension's own booleans
 * through the one adapter over them (`application/connections/session-outcome`).
 */
import {
  readFailedEnvelope,
  type SessionOutcome,
} from "../../application/connections/session-outcome";
import { isAcceptedBridgeProtocol } from "./bridge-protocol";
import { probeResultOf, sessionOutcomeOf } from "./bridge-session-outcome";
import {
  active,
  inactive,
  outdatedExtension,
  type SessionProbeResult,
  unreachable,
} from "./bridge-session-probe-types";
import type { ExtensionResponse } from "./bridge-transport";

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
  bridgeId: string,
  readSession: (data: unknown) => SessionOutcome
): SessionProbeResult => {
  if (res.delivered === false) return unreachable(res.error ?? null);
  if (!isAcceptedBridgeProtocol(bridgeId, res.protocolVersion)) {
    return outdatedExtension("unsupported protocol version");
  }
  if (!res.ok) {
    return fromOutcome(
      readFailedEnvelope(res.needsReauth === true),
      res.error ?? null
    );
  }
  const typed = sessionOutcomeOf(res.data);
  if (typed !== null) return probeResultOf(typed);
  return fromOutcome(readSession(res.data));
};
