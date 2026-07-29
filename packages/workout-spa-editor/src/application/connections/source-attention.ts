/**
 * The one attention derivation over the Connections page's own card list.
 *
 * It counts exactly what the cards mark amber, because it reads their
 * `status`. A second predicate over the raw bridge rows would drift:
 * `bridgeSourceStatus` already resolves the cases a naive rule gets wrong —
 * a bridge with no session prober reads as installed rather than broken, an
 * unlinked or absent one as available, and one whose first probe has not
 * answered as checking rather than as failing.
 *
 * That last case is also why nothing here gates on "has discovery run yet":
 * before the first pass every row reads undiscovered, which makes every card
 * `available`, which `needsAttention` rejects. A source cannot reach
 * `attention` until a probe has answered for it, so the silence is
 * structural. Adding a clock on top would guard a state that cannot occur.
 *
 * The result is i18n-free on purpose: the Settings banner and the header
 * pill word the same fact differently, and only the wording may differ.
 */
import type { ConnectionSource } from "./connection-source";

export const needsAttention = (source: ConnectionSource): boolean =>
  source.status === "attention";

/**
 * The one field `countDetected` reads. Declared here rather than imported so
 * this layer stays adapter-free; `BridgeConnectionState` satisfies it
 * structurally, the same arrangement `connection-source-status` uses.
 */
export type DiscoverySignal = { readonly discovered: boolean };

/**
 * How many bridges answered. A page cannot enumerate installed extensions:
 * `discovered` means the extension announced itself and its last probe
 * reached it, which is why the copy says detected rather than installed.
 */
export const countDetected = (
  connections: readonly DiscoverySignal[]
): number => connections.filter((entry) => entry.discovered).length;

/**
 * Why the affected sources are affected, ranked by what the reader can do
 * about it: an instruction outranks a date. Both instructions routinely
 * coexist with a `lastSyncAt` — you only get a re-auth demand for an account
 * you were already syncing — so ranking the date first would hide the only
 * actionable line in the ordinary case.
 *
 * `signedOut` is the fallback rather than a failed-check line: every
 * remaining case is a reachable extension without a usable session, which is
 * the same verdict the source card states. It never says "expired" — no
 * bridge distinguishes an expired credential from one that was never issued.
 *
 * There is no "broken since": `lastSyncAt` is persisted, so the date is when
 * data last arrived; `lastCheckedAt` is when the SPA last probed and reads as
 * seconds ago after a reload however long a source has been down.
 */
export type AttentionCause =
  | { readonly kind: "signedOut" }
  | { readonly kind: "extensionOutdated" }
  | { readonly kind: "noNewDataSince"; readonly date: string };

export type ConnectionAttention = {
  /** Always ≥ 1: a healthy app produces no model at all. */
  readonly count: number;
  readonly cause: AttentionCause;
};

/**
 * The user's calendar day, not `toISOString()`'s: a sync at 02:00Z happened
 * the previous evening in New York, and the sentence is about their day.
 * Nothing when the stored value does not parse as a date.
 */
const dayOf = (timestamp: string | undefined): string | undefined => {
  if (timestamp === undefined) return undefined;
  const at = new Date(timestamp);
  if (Number.isNaN(at.getTime())) return undefined;
  const month = String(at.getMonth() + 1).padStart(2, "0");
  return `${at.getFullYear()}-${month}-${String(at.getDate()).padStart(2, "0")}`;
};

const causeOf = (affected: readonly ConnectionSource[]): AttentionCause => {
  if (affected.some((source) => source.needsReauth))
    return { kind: "signedOut" };
  if (affected.some((source) => source.outdated))
    return { kind: "extensionOutdated" };
  const date =
    affected.length === 1 ? dayOf(affected[0]?.lastSyncAt) : undefined;
  return date === undefined
    ? { kind: "signedOut" }
    : { kind: "noNewDataSince", date };
};

export const buildConnectionAttention = (
  sources: readonly ConnectionSource[]
): ConnectionAttention | null => {
  const affected = sources.filter(needsAttention);
  if (affected.length === 0) return null;
  return { count: affected.length, cause: causeOf(affected) };
};
