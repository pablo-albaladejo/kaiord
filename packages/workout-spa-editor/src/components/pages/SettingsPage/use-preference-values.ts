/**
 * Values rendered on the Settings index Preferences rows. Mirrors
 * `PreferencesTab` exactly, including its fallback to the defaults when no
 * profile is active (`useUserPreferences` returns `undefined` for a null
 * profileId), so the index and the tab can never disagree.
 */

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { type Translate, useTranslate } from "../../../i18n/use-translate";
import type { LocalePreference, Units } from "../../../types/user-preferences";
import type { NotificationPermissionState } from "../../organisms/SettingsPanel/use-notification-permission";
import { useNotificationPermission } from "../../organisms/SettingsPanel/use-notification-permission";

export type PreferenceValues = {
  units: string;
  language: string;
  notifications: string;
};

const notificationValue = (
  t: Translate,
  enabled: boolean,
  permission: NotificationPermissionState
): string => {
  if (permission === "unsupported")
    return t("values.notifications.unsupported");
  if (permission === "denied") return t("values.notifications.blocked");
  const on = enabled && permission === "granted";
  return t(on ? "values.notifications.on" : "values.notifications.off");
};

export const usePreferenceValues = (): PreferenceValues => {
  const t = useTranslate("settings");
  const common = useTranslate("common");
  const activeLocale = useActiveLocale();
  const active = useActiveProfileLive();
  const prefs = useUserPreferences({
    profileId: active?.id ?? null,
    defaultView: "grid",
  });
  const { permission } = useNotificationPermission();

  const units: Units = prefs?.units ?? "metric";
  const locale: LocalePreference = prefs?.locale ?? "auto";

  return {
    units: t(`preferences.${units}`),
    language: common(`language.${locale === "auto" ? activeLocale : locale}`),
    notifications: notificationValue(
      t,
      prefs?.notificationsEnabled ?? false,
      permission
    ),
  };
};
