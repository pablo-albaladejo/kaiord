/**
 * View model for one card on the Connections page.
 *
 * Every field is derived from a live signal. Nothing here encodes when a
 * source broke, which types it is "primary for", or what it would send once
 * connected: no state backs any of those, so the card cannot claim them.
 */
import type { ManagedDataType } from "@kaiord/core";
import type {
  ConnectionReason,
  ConnectionState,
} from "@kaiord/i18n/connection-notices";

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
  /**
   * The Connection's verified state, which words its one notice through
   * `connectionNotice` (`@kaiord/i18n`). `null` for a source that is not an
   * extension, and for one the athlete disconnected while it is installed:
   * its card offers Reconnect instead of a fix.
   */
  readonly connection: ConnectionState | null;
  /** Why a working Session cannot serve (a WHOOP token with no account id),
      which words the card's notice instead of its state. */
  readonly reason?: ConnectionReason | null;
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

const CONNECTED: ReadonlySet<ConnectionSourceStatus> = new Set([
  "connected",
  "installed",
  "checking",
  "attention",
]);

/**
 * Is this source linked for the athlete, whatever shape it is in? A source
 * that needs attention or is still being checked is connected — what it needs
 * is a fix, not a connect. Manual entry is always on and the unsupported
 * brands never connect, so neither is counted.
 */
export const sourceIsConnected = (source: ConnectionSource): boolean =>
  CONNECTED.has(source.status);

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
