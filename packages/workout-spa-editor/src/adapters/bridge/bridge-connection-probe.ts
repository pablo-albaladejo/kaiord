/**
 * Probing one bridge.
 *
 * The 30-second cache is POSITIVE-ONLY, mirroring `store/train2go-detect`: a
 * previous "session inactive" (content script not injected yet, no upstream
 * tab open, transient cookie issue) MUST NOT block the next probe, otherwise
 * the UI keeps offering "Connect" long after the user signed in.
 */
import { type RefreshContext, write } from "./bridge-connection-context";
import { undiscoveredEntry } from "./bridge-connection-entries";
import type { BridgeConnectionRuntime } from "./bridge-connection-types";
import {
  inactive,
  type SessionProber,
  type SessionProbeResult,
} from "./bridge-session-probe-types";

export const POSITIVE_CACHE_MS = 30_000;

const isCacheFresh = (entry: BridgeConnectionRuntime, at: number): boolean =>
  entry.sessionActive &&
  entry.lastCheckedAt !== null &&
  at - entry.lastCheckedAt < POSITIVE_CACHE_MS;

/**
 * Last-resort guard: probers are contractually non-throwing, but a rejection
 * here would leave the row stuck on `checking: true` — and the re-entrancy
 * guard would then refuse every later probe for that bridge.
 */
const runProbe = async (
  probe: SessionProber,
  extensionId: string
): Promise<SessionProbeResult> => {
  try {
    return await probe(extensionId);
  } catch (err) {
    return inactive(err instanceof Error ? err.message : String(err));
  }
};

export type ProbeRequest = {
  bridgeId: string;
  extensionId: string;
  /** Resolved by the caller, which is where "has a prober" is decided. */
  probe: SessionProber;
  force: boolean;
};

export const probeBridge = async (
  ctx: RefreshContext,
  { bridgeId, extensionId, probe, force }: ProbeRequest
): Promise<void> => {
  const current = ctx.entries.get(bridgeId);
  if (current?.checking) return;
  if (!force && current && isCacheFresh(current, ctx.now())) return;
  write(ctx, bridgeId, { discovered: true, checking: true });
  const result = await runProbe(probe, extensionId);
  const liveId = ctx.getExtensionId(bridgeId);
  if (liveId !== extensionId) {
    // The extension vanished or was swapped while the probe was in flight, so
    // its answer describes a bridge that is no longer there. Drop the result
    // but release `checking`, otherwise the re-entrancy guard above would
    // block this bridge forever.
    write(ctx, bridgeId, {
      ...undiscoveredEntry(bridgeId),
      discovered: liveId !== null,
    });
    return;
  }
  write(ctx, bridgeId, {
    ...result,
    discovered: true,
    checking: false,
    lastCheckedAt: ctx.now(),
  });
};
