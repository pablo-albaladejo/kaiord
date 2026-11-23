import {
  type ConnectionNotice,
  connectionNotice,
  type ConnectionReason,
  connectionReasonNotice,
  type ConnectionState,
  type Locale,
} from "@kaiord/i18n";

/**
 * The one notice a Connection shows: a working Session that cannot serve
 * shows its reason's notice, anything else the notice of its state, both
 * worded by the shared notices every popup reads.
 */
export const connectionNoticeOf = (
  state: ConnectionState | null,
  reason: ConnectionReason | null,
  platform: string,
  locale: Locale
): ConnectionNotice | null => {
  if (reason !== null && state === "working") {
    return connectionReasonNotice(reason, platform, locale);
  }
  return state === null ? null : connectionNotice(state, platform, locale);
};
