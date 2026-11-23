import {
  type ConnectionNotice,
  connectionNotice,
  type ConnectionState,
} from "@kaiord/i18n";

import { useActiveLocale } from "../../../i18n/LocaleProvider";

/** The notice a Connection in `state` shows, in the App's active locale. */
export const useConnectionNotice = (
  state: ConnectionState | null,
  platform: string
): ConnectionNotice | null => {
  const locale = useActiveLocale();
  return state === null ? null : connectionNotice(state, platform, locale);
};
