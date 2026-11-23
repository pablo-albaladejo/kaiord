/**
 * Reads the bridge's ping answer: installed, the Connection's verified state,
 * and the calendar `features` it supports (`[]` for a bridge that predates
 * them). The state comes from `classifyEnvelope`, the very function the
 * Connections page's probe uses, so the send path and the Garmin card can
 * never word one ping two ways.
 */
import { classifyEnvelope } from "../adapters/bridge/bridge-ping-session-probes";
import type { ExtensionResponse } from "../adapters/bridge/bridge-transport";
import type { ConnectionState } from "../application/connections/connection-state";
import { connectionStateOf } from "../application/connections/connection-state";
import { readGarminSession } from "../application/connections/session-outcome";

export type DetectionResult = {
  installed: boolean;
  /** The Connection works: the only case a send may start. */
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
 * A ping that never reached the extension is "not-installed": the send path
 * only pings an extension discovery already announced, so an undelivered
 * ping is the extension gone. Everything after delivery is the probe's rule.
 */
export function evaluatePingResult(res: ExtensionResponse): DetectionResult {
  const probe = classifyEnvelope(res, readGarminSession);
  const connection = probe.reachable
    ? connectionStateOf(
        { ...probe, checking: false, lastCheckedAt: 0 },
        { installed: true, settled: true, hasProbe: true }
      )
    : "not-installed";
  return {
    installed: probe.reachable,
    session: connection === "working",
    connection,
    features: probe.reachable ? featuresOf(res.data) : [],
  };
}
