/**
 * Reads the bridge's ping answer: installed, the Connection's verified state,
 * and the calendar `features` it supports (`[]` for a bridge that predates
 * them). The state comes from `classifyEnvelope`, the very function the
 * Connections page's probe uses, so the send path and the Garmin card can
 * never word one ping two ways.
 */
import { classifyEnvelope } from "../adapters/bridge/bridge-envelope-classify";
import type { ExtensionResponse } from "../adapters/bridge/bridge-transport";
import {
  connectionMayBeUsed,
  type ConnectionState,
  connectionStateOf,
} from "../application/connections/connection-state";
import { readGarminSession } from "../application/connections/session-outcome";

export type DetectionResult = {
  installed: boolean;
  /** A send may start: the Connection works, or its check asked nothing. */
  session: boolean;
  connection: ConnectionState;
  features: string[];
};

/** The ping's `features`; an older bridge sends none. */
const featuresOf = (data: unknown): string[] => {
  const raw = (data as { features?: unknown } | undefined)?.features;
  return Array.isArray(raw) ? raw.filter((f) => typeof f === "string") : [];
};

/**
 * Only an extension discovery announced is pinged, so a ping that got no
 * answer is "not-answering" (Garmin's ping makes a live read, which can be
 * slow), never "not-installed": the same rule the Connections card applies.
 */
export function evaluatePingResult(res: ExtensionResponse): DetectionResult {
  const probe = classifyEnvelope(res, "garmin-bridge", readGarminSession);
  const connection = connectionStateOf(
    { ...probe, checking: false, lastCheckedAt: 0 },
    { installed: probe.reachable, settled: true, hasProbe: true }
  );
  return {
    installed: probe.reachable,
    session: connectionMayBeUsed(connection),
    connection,
    features: probe.reachable ? featuresOf(res.data) : [],
  };
}
