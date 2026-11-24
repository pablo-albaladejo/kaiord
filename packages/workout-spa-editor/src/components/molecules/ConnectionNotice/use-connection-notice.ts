import type {
  ConnectionReason,
  ConnectionState,
  ShownNotice,
} from "@kaiord/i18n/connection-notices";

import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { connectionNoticeOf } from "./connection-notice-of";

/** The notice a Connection in `state` shows, in the App's active locale; a
    working Session that cannot serve shows its `reason`'s notice. */
export const useConnectionNotice = (
  state: ConnectionState | null,
  platform: string,
  reason: ConnectionReason | null = null
): ShownNotice | null => {
  const locale = useActiveLocale();
  return connectionNoticeOf(state, reason, platform, locale);
};
