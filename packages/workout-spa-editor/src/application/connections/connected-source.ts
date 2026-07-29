/**
 * Whether an integration counts as connected.
 *
 * For a bridge the rule is absence-tolerant: discovered AND not explicitly
 * disconnected. Nothing in the app writes a `"connected"` bridge record —
 * the only `"bridge"` call site on the connection provider is disconnect —
 * so a bridge's row is either `"disconnected"` or absent, and demanding an
 * explicit `"connected"` record would report every working bridge as
 * available forever. A missing record therefore means "never disconnected".
 *
 * `api-key` providers do write a record on connect, so they keep the strict
 * rule. `manual` is always on and `not-supported` never connects.
 */
import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { ConnectionRecord } from "../../types/connection";

export const isBridgeConnected = (
  discovered: boolean,
  record: ConnectionRecord | undefined
): boolean => discovered && record?.status !== "disconnected";

/**
 * `manual` answers false: the question is whether an ACCOUNT is linked, and
 * manual entry has no account to link. Callers that render it say "always on"
 * from the mechanism, not from this predicate.
 */
export const isSourceConnected = (
  entry: IntegrationRegistryEntry,
  record: ConnectionRecord | undefined,
  isDiscovered: (bridgeId: string) => boolean
): boolean => {
  if (entry.mechanism === "manual") return false;
  if (entry.mechanism === "bridge" && entry.bridgeId !== null) {
    return isBridgeConnected(isDiscovered(entry.bridgeId), record);
  }
  return record?.status === "connected";
};
