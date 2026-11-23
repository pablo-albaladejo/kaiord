import notices, {
  type ConnectionFix,
  type ConnectionNotice,
  type ConnectionState,
} from "../../_shared/bridge-core/connection-notices.js";
import type { Locale } from "./types";

export type { ConnectionFix, ConnectionNotice, ConnectionState };

/** The closed set of fixes, in the order the athlete would need them. */
export const CONNECTION_FIXES: readonly ConnectionFix[] = notices.FIXES;

/**
 * The notice a Connection in `state` shows on `platform`, or `null` when it
 * works (or is still being checked). The same function every extension popup
 * calls, so the App and a popup cannot word one state two ways.
 */
export const connectionNotice = (
  state: ConnectionState,
  platform: string,
  locale: Locale
): ConnectionNotice | null => notices.noticeFor(state, platform, locale);

/** The fix a state offers, without its wording. */
export const connectionFix = (state: ConnectionState): ConnectionFix | null =>
  notices.fixFor(state);
