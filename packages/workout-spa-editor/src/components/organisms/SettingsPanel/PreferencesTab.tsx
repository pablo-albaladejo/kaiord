import { useDevicePreferences } from "../../../hooks/use-device-preferences";
import { useTranslate } from "../../../i18n/use-translate";
import type { LocalePreference, Units } from "../../../types/user-preferences";
import { Segmented, type SegmentedOption } from "../../atoms/Segmented";
import { SectionHead } from "../../molecules/SectionHead";
import { LanguageRow } from "./LanguageRow";
import { NotificationsRow } from "./NotificationsRow";

export const PreferencesTab: React.FC = () => {
  const t = useTranslate("settings");
  const { prefs, ready, update } = useDevicePreferences();
  // Until this device's record is seeded from the active profile's legacy
  // values, a tap would overwrite the ones not yet read.
  const unresolved = !ready;
  const units: Units = prefs.units ?? "metric";
  const locale: LocalePreference = prefs.locale ?? "auto";
  const unitOptions: SegmentedOption<Units>[] = [
    { value: "metric", label: t("preferences.metric") },
    { value: "imperial", label: t("preferences.imperial") },
  ];

  const handleUnits = (next: Units) => update({ units: next });
  const handleLocale = (next: LocalePreference) => update({ locale: next });
  const handleNotifications = (next: boolean) =>
    update({ notificationsEnabled: next });

  return (
    <div className="space-y-6" data-testid="settings-preferences">
      <section>
        <SectionHead title={t("preferences.units")} />
        <Segmented
          options={unitOptions}
          value={units}
          onChange={handleUnits}
          ariaLabel={t("preferences.units")}
          disabled={unresolved}
        />
      </section>
      <LanguageRow
        value={locale}
        onChange={handleLocale}
        disabled={unresolved}
      />
      <section>
        <SectionHead title={t("preferences.notifications")} />
        <NotificationsRow
          enabled={prefs.notificationsEnabled ?? false}
          onChange={handleNotifications}
          disabled={unresolved}
        />
      </section>
    </div>
  );
};
