/**
 * One refresh pass over every known bridge.
 *
 * Bridge discovery only ever `.set()`s an extension id and never expires one,
 * so `getExtensionId` alone cannot tell a live extension from an uninstalled
 * one. Liveness therefore comes from the probe a bridge already runs: a
 * delivery failure means the extension is gone and the row goes undiscovered.
 * That costs no extra message — the probe was being sent anyway.
 *
 * A bridge with NO prober is reported as discovered-only and is never
 * messaged. A prober itself asks an extension one protocol behind nothing
 * when its check would cost data or a token (`bridge-ping-session-probes`),
 * and reports it "not checked".
 */
import { type RefreshContext, write } from "./bridge-connection-context";
import { undiscoveredEntry } from "./bridge-connection-entries";
import { probeBridge } from "./bridge-connection-probe";

export type { RefreshContext } from "./bridge-connection-context";

const refreshBridge = async (
  ctx: RefreshContext,
  bridgeId: string,
  force: boolean
): Promise<void> => {
  const extensionId = ctx.getExtensionId(bridgeId);
  if (extensionId === null) {
    write(ctx, bridgeId, undiscoveredEntry(bridgeId));
    return;
  }
  const probe = ctx.probes[bridgeId];
  if (!probe) {
    write(ctx, bridgeId, { ...undiscoveredEntry(bridgeId), discovered: true });
    return;
  }
  await probeBridge(ctx, { bridgeId, extensionId, probe, force });
};

export const refreshConnections = async (
  ctx: RefreshContext,
  force: boolean
): Promise<void> => {
  // allSettled, not all: one unreachable bridge cannot abort the pass.
  await Promise.allSettled(
    ctx.bridgeIds.map((bridgeId) => refreshBridge(ctx, bridgeId, force))
  );
};
