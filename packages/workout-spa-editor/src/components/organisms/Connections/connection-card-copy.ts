import type { NotCheckedReason } from "@kaiord/i18n";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import type { ConnectionSourceStatus } from "../../../application/connections/connection-source";
import { extensionOf } from "../../../application/connections/extension-descriptors";

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
 * Every key `detailKeyFor` may return. A Connection that does not work has no
 * detail line of its own: its card shows the Connection notice instead
 * (`ConnectionCardNotice`), worded once for the App and every extension.
 */
export type DetailKey =
  | "detail.installed"
  | "detail.checking"
  | "detail.manual"
  | "detail.unsupported"
  | "detail.disconnected";

/**
 * Why a probed bridge's check asked nothing, worded per reason by the shared
 * notices (`connectionNotCheckedText`): `null` when the card says something
 * else.
 */
export const notCheckedReasonFor = (
  source: ConnectionSource
): NotCheckedReason | null =>
  source.status === "installed" && source.sessionVerifiable
    ? (extensionOf(source.bridgeId)?.notChecked ?? null)
    : null;

export const detailKeyFor = (source: ConnectionSource): DetailKey | null => {
  switch (source.status) {
    case "installed":
      return notCheckedReasonFor(source) === null ? "detail.installed" : null;
    case "checking":
      return "detail.checking";
    case "attention":
      return null;
    case "manual":
      return "detail.manual";
    case "unsupported":
      return "detail.unsupported";
    case "available":
      // A missing extension is said once, by the card's Install notice.
      if (source.mechanism !== "bridge" || !source.bridgeDetected) return null;
      return "detail.disconnected";
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
