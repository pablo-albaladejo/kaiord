/**
 * One refresh pass over every known bridge.
 *
 * A discovered bridge with no registered prober is reported as discovered
 * only — it is never messaged. That is how `tanita-bridge` behaves today:
 * its `checkSession` downloads the whole export CSV, so it has no prober.
 */
import { type RefreshContext, write } from "./bridge-connection-context";
import { undiscoveredEntry } from "./bridge-connection-entries";
import { probeBridge } from "./bridge-connection-probe";

export type { RefreshContext } from "./bridge-connection-context";

const refreshBridge = (
  ctx: RefreshContext,
  bridgeId: string,
  force: boolean
): Promise<void> | undefined => {
  const extensionId = ctx.getExtensionId(bridgeId);
  if (extensionId === null) {
    write(ctx, bridgeId, undiscoveredEntry(bridgeId));
    return undefined;
  }
  const probe = ctx.probes[bridgeId];
  if (!probe) {
    write(ctx, bridgeId, { ...undiscoveredEntry(bridgeId), discovered: true });
    return undefined;
  }
  return probeBridge(ctx, { bridgeId, extensionId, probe, force });
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
