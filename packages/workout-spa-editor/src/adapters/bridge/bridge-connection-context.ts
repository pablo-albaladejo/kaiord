/**
 * Shared context for a refresh pass, plus the single write path into the
 * entry map. Lives apart from both the prober and the pass so those two can
 * depend on it without a cycle.
 */
import { applyEntry } from "./bridge-connection-entries";
import type { BridgeConnectionRuntime } from "./bridge-connection-types";
import type { SessionProber } from "./bridge-session-probe-types";

export type RefreshContext = {
  entries: Map<string, BridgeConnectionRuntime>;
  probes: Record<string, SessionProber>;
  bridgeIds: readonly string[];
  getExtensionId: (bridgeId: string) => string | null;
  now: () => number;
  notify: () => void;
};

/** Writes the patch and notifies only when the row observably changed. */
export const write = (
  ctx: RefreshContext,
  bridgeId: string,
  patch: Partial<BridgeConnectionRuntime>
): void => {
  if (applyEntry(ctx.entries, bridgeId, patch)) ctx.notify();
};
