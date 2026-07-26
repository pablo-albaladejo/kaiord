import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import { useTranslate } from "../../../i18n/use-translate";
import type { LocalePreference, Units } from "../../../types/user-preferences";
import { logger } from "../../../utils/logger";
import { Segmented, type SegmentedOption } from "../../atoms/Segmented";
import { SectionHead } from "../../molecules/SectionHead";
import { LanguageRow } from "./LanguageRow";
import { NotificationsRow } from "./NotificationsRow";

export const PreferencesTab: React.FC = () => {
  const t = useTranslate("settings");
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);
  const units: Units = prefs?.units ?? "metric";
  const locale: LocalePreference = prefs?.locale ?? "auto";
  const unitOptions: SegmentedOption<Units>[] = [
    { value: "metric", label: t("preferences.metric") },
    { value: "imperial", label: t("preferences.imperial") },
  ];

  const handleUnits = (next: Units) => {
    void setPrefs({ units: next }).catch((error: unknown) => {
      logger.warn("Failed to persist units preference", { error });
    });
  };

  const handleLocale = (next: LocalePreference) => {
    void setPrefs({ locale: next }).catch((error: unknown) => {
      logger.warn("Failed to persist locale preference", { error });
    });
  };

  const handleNotifications = (next: boolean) => {
    void setPrefs({ notificationsEnabled: next }).catch((error: unknown) => {
      logger.warn("Failed to persist notifications preference", { error });
    });
  };

  return (
    <div className="space-y-6" data-testid="settings-preferences">
      <section>
        <SectionHead title={t("preferences.units")} />
        <Segmented
          options={unitOptions}
          value={units}
          onChange={handleUnits}
          ariaLabel={t("preferences.units")}
        />
      </section>
      <LanguageRow value={locale} onChange={handleLocale} />
      <section>
        <SectionHead title={t("preferences.notifications")} />
        <NotificationsRow
          enabled={prefs?.notificationsEnabled ?? false}
          onChange={handleNotifications}
        />
      </section>
    </div>
  );
};
