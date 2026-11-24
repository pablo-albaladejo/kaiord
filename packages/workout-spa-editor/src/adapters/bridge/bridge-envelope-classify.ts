/**
 * The classification of one Session-check answer: delivery, then the
 * protocol version from the envelope, then the typed outcome an extension
 * with the cheap check answers, then an older extension's own booleans
 * through the readers over them (`bridge-legacy-session-readers`).
 */
import type { SessionOutcome } from "../../application/connections/session-outcome";
import { readFailedEnvelope } from "./bridge-legacy-session-readers";
import { isAcceptedBridgeProtocol } from "./bridge-protocol";
import { probeResultOf, sessionOutcomeOf } from "./bridge-session-outcome";
import {
  active,
  inactive,
  notChecked,
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
  if (outcome === "not-checked") return notChecked();
  return inactive(error, outcome === "signed-out");
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
