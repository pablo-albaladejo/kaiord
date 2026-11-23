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
 * The result is i18n-free on purpose: the wording comes from the one source
 * of Connection notices, through `attentionCauseText`.
 */
import type { ConnectionSource } from "./connection-source";
import { sourceNeedsAttention } from "./connection-source";
import type { ConnectionState } from "./connection-state";

// Aliased, not redefined: the summary, the banner and the header pill answer
// the same question as the cards, so there is one predicate to change.
export const needsAttention = sourceNeedsAttention;

/**
 * Why the affected sources are affected. A lone source is named by its own
 * Connection state, so the pill and the banner word it exactly as its card
 * and its extension popup do. With several, no single cause holds for all of
 * them, so only the count is claimed.
 */
export type AttentionCause =
  | {
      readonly kind: "notice";
      readonly connection: ConnectionState;
      readonly name: string;
    }
  | { readonly kind: "several" };

export type ConnectionAttention = {
  /** Always ≥ 1: a healthy app produces no model at all. */
  readonly count: number;
  readonly cause: AttentionCause;
};

const causeOf = (affected: readonly ConnectionSource[]): AttentionCause => {
  const only = affected.length === 1 ? affected[0] : undefined;
  if (only?.connection == null) return { kind: "several" };
  return { kind: "notice", connection: only.connection, name: only.name };
};

export const buildConnectionAttention = (
  sources: readonly ConnectionSource[]
): ConnectionAttention | null => {
  const affected = sources.filter(needsAttention);
  if (affected.length === 0) return null;
  return { count: affected.length, cause: causeOf(affected) };
};
