import type { ConnectionSource } from "../../../application/connections/connection-source";
import type { ConnectionSourceStatus } from "../../../application/connections/connection-source";

/**
 * Two ink levels, no hues. A source that works is not news, so "connected" is
 * told from "not connected" by the word rather than by green; `attention` is
 * the only status that raises its ink, and `ConnectionStatusLine` renders it
 * with the attention mark instead of a dot.
 */
export const STATUS_DOT: Record<ConnectionSourceStatus, string> = {
  connected: "bg-ink-body",
  installed: "bg-ink-body",
  checking: "bg-ink-muted animate-pulse",
  attention: "bg-ink-strong",
  available: "bg-ink-muted",
  manual: "bg-ink-body",
  unsupported: "bg-ink-muted",
};

export const STATUS_TEXT: Record<ConnectionSourceStatus, string> = {
  connected: "text-ink-body",
  installed: "text-ink-body",
  checking: "text-ink-muted",
  attention: "text-ink-strong",
  available: "text-ink-muted",
  manual: "text-ink-body",
  unsupported: "text-ink-muted",
};

/**
 * The second line under the status. `available` splits by cause: an explicit
 * disconnect and a missing extension look identical in the status word but
 * need opposite next steps, and only one of them has a control.
 *
 * A missing extension wins that split even when the source was also
 * disconnected. Both are true, but the absent extension is the blocking one —
 * telling a user they unlinked a source they cannot re-link yet points them at
 * the wrong problem. Once the extension is back, the card reports the
 * disconnect and offers Reconnect.
 */

/**
 * Every `detail.*` key the `attention` branch can reach, and the list the copy
 * honesty guard enumerates. `attentionDetailKey` returns this type, so tsc
 * rejects a branch returning a key absent here.
 */
export const ATTENTION_DETAIL_KEYS = [
  "detail.outdated",
  "detail.noAccess",
] as const;

export type AttentionDetailKey = (typeof ATTENTION_DETAIL_KEYS)[number];

/**
 * Every key `detailKeyFor` may return, which is why the `attention` case cannot
 * return an invented one.
 *
 * This is a SUPERSET of `ATTENTION_DETAIL_KEYS`, so it does not by itself keep
 * an attention key under the honesty guard: a non-attention key reused in that
 * case, or a new key added here rather than to `ATTENTION_DETAIL_KEYS`, both
 * type-check. Typing each status with its own key space would close both.
 */
export type DetailKey =
  | AttentionDetailKey
  | "detail.installed"
  | "detail.checking"
  | "detail.manual"
  | "detail.unsupported"
  | "detail.disconnected"
  | "detail.notDetected";

/**
 * `needsReauth` has no branch of its own on purpose. Its only producer is
 * TrainingPeaks (`bridge-session-probes.ts` is the sole `needsReauthOf` call
 * site), where `authError` forces the flag true for any non-2xx, so it
 * carries no information. And TrainingPeaks has no authorisation to re-grant:
 * its durable credential is the `Production_tpAuth` session cookie, so "sign in
 * again" — what `noAccess` already says — is the more accurate remedy.
 */
const attentionDetailKey = (source: ConnectionSource): AttentionDetailKey =>
  // `outdated` is read FIRST and is the one attention cause whose fix is not
  // signing in. A bridge answering in an unreadable protocol version reaches
  // `attention` through `error !== null`, so without this branch it fell to the
  // generic cause and told the reader to sign in — an action that cannot
  // resolve a version mismatch, beside a banner on the same screen already
  // saying the extension is out of date.
  source.outdated ? "detail.outdated" : "detail.noAccess";

export const detailKeyFor = (source: ConnectionSource): DetailKey | null => {
  switch (source.status) {
    case "installed":
      return "detail.installed";
    case "checking":
      return "detail.checking";
    case "attention":
      // `noAccess` is the fallback because it is the strongest claim the
      // evidence supports. Every remaining case is a probe that came back
      // without a usable read, and no bridge can say why: garmin, train2go and
      // whoop all fold a provider outage into the same "no session" answer as a
      // dead credential (`background.js` ping catch-alls, `probeWhoopSession`'s
      // `inactive()`). Garmin makes the old "signed out" verdict outright
      // false — its OAuth1 token in `chrome.storage.local` mints bearers with
      // no cookie, so reads outlive signing out of connect.garmin.com and a
      // failed read is no evidence about the user's session at all. The
      // sign-in CTA stays: re-signing in genuinely re-mints. Only the
      // diagnosis attached to it was wrong.
      return attentionDetailKey(source);
    case "manual":
      return "detail.manual";
    case "unsupported":
      return "detail.unsupported";
    case "available":
      if (source.mechanism !== "bridge") return null;
      return source.bridgeDetected
        ? "detail.disconnected"
        : "detail.notDetected";
    default:
      return null;
  }
};

/** A source the user can currently unlink: something is linked to unlink. */
export const canDisconnect = (source: ConnectionSource): boolean =>
  source.status === "connected" ||
  source.status === "installed" ||
  source.status === "checking" ||
  source.status === "attention";

/**
 * Re-linking only exists where a disconnect can be undone. An absent
 * extension cannot be installed from this page, so no control is offered
 * for it — the detail line says what to do instead.
 */
export const canReconnect = (source: ConnectionSource): boolean =>
  source.mechanism === "bridge" && source.disconnected && source.bridgeDetected;
