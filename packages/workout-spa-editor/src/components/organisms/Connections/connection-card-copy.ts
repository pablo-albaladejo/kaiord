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
 */
export const detailKeyFor = (source: ConnectionSource): string | null => {
  switch (source.status) {
    case "installed":
      return "detail.installed";
    case "checking":
      return "detail.checking";
    case "attention":
      return source.needsReauth ? "detail.needsReauth" : "detail.signedOut";
    case "manual":
      return "detail.manual";
    case "unsupported":
      return "detail.unsupported";
    case "available":
      if (source.mechanism !== "bridge") return null;
      return source.disconnected ? "detail.disconnected" : "detail.notDetected";
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
