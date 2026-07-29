/**
 * View model for one card on the Connections page.
 *
 * Every field is derived from a live signal. Nothing here encodes when a
 * source broke, which types it is "primary for", or what it would send once
 * connected: no state backs any of those, so the card cannot claim them.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { ConnectionMechanism } from "../../types/connection";

export type ConnectionSourceStatus =
  | "connected"
  | "installed"
  | "checking"
  | "attention"
  | "available"
  | "manual"
  | "unsupported";

export type ConnectionSource = {
  readonly id: string;
  readonly name: string;
  readonly mark: string;
  readonly mechanism: ConnectionMechanism;
  readonly bridgeId: string | null;
  readonly status: ConnectionSourceStatus;
  /** The extension announced itself and passed verification. */
  readonly bridgeDetected: boolean;
  /** A stored record explicitly says the user unlinked this source. Separates
      "you disconnected it" from "the extension is not here". */
  readonly disconnected: boolean;
  /** Only `trainingpeaks-bridge` ever propagates this today. */
  readonly needsReauth: boolean;
  /**
   * The extension answered with a protocol version this build cannot read.
   * A diagnosis, not a failure — the fix is updating the extension, which no
   * other attention cause shares.
   */
  readonly outdated: boolean;
  /**
   * Can this source's presence and session be re-checked at all? False for a
   * bridge with no prober: after its initial announcement nothing can learn it
   * was uninstalled, so its copy may not use the present tense.
   */
  readonly sessionVerifiable: boolean;
  readonly lastSyncAt: string | undefined;
  /** Routes this source actually serves — announced token ∩ cabled route. */
  readonly importTypes: readonly ManagedDataType[];
  readonly exportTypes: readonly ManagedDataType[];
};

/**
 * The one attention predicate. Every surface that summarises this page — the
 * Settings banner, the section's own counter and its consequence banner —
 * calls this over the same list the cards are rendered from, so a summary can
 * never contradict the cards beneath it.
 */
export const sourceNeedsAttention = (source: ConnectionSource): boolean =>
  source.status === "attention";

/**
 * Card order: what is working, then what needs a decision, then what is not
 * there. Manual entry and the unsupported brands sit last because neither is
 * ever actionable.
 */
const RANK: Record<ConnectionSourceStatus, number> = {
  connected: 0,
  installed: 1,
  checking: 2,
  attention: 3,
  available: 4,
  manual: 5,
  unsupported: 6,
};

export const connectionSourceRank = (source: ConnectionSource): number =>
  RANK[source.status];
