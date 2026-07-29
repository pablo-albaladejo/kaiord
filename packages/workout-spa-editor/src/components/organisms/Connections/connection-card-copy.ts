import type { ConnectionSource } from "../../../application/connections/connection-source";
import type { ConnectionSourceStatus } from "../../../application/connections/connection-source";

export const STATUS_DOT: Record<ConnectionSourceStatus, string> = {
  connected: "bg-emerald-500",
  installed: "bg-accent",
  checking: "bg-accent animate-pulse",
  attention: "bg-amber-500",
  available: "bg-ink-muted",
  manual: "bg-accent",
  unsupported: "bg-ink-muted",
};

export const STATUS_TEXT: Record<ConnectionSourceStatus, string> = {
  connected: "text-emerald-600 dark:text-emerald-400",
  installed: "text-ink-body",
  checking: "text-ink-muted",
  attention: "text-amber-600 dark:text-amber-400",
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
export const detailKeyFor = (source: ConnectionSource): string | null => {
  switch (source.status) {
    case "installed":
      return "detail.installed";
    case "checking":
      return "detail.checking";
    case "attention":
      // `outdated` is read FIRST and is the one attention cause whose fix is
      // not signing in. A bridge answering in an unreadable protocol version
      // reaches `attention` through `error !== null`, so without this branch it
      // fell to `signedOut` and told the reader to open the provider's site —
      // an action that cannot resolve a version mismatch, beside a banner on
      // the same screen already saying the extension is out of date.
      if (source.outdated) return "detail.outdated";
      return source.needsReauth ? "detail.needsReauth" : "detail.signedOut";
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
