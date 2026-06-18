import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import type { Units } from "../../../types/user-preferences";
import { logger } from "../../../utils/logger";
import { Segmented, type SegmentedOption } from "../../atoms/Segmented";
import { SectionHead } from "../../molecules/SectionHead";
import { NotificationsRow } from "./NotificationsRow";

const UNIT_OPTIONS: SegmentedOption<Units>[] = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

export const PreferencesTab: React.FC = () => {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);
  const units: Units = prefs?.units ?? "metric";

  const handleUnits = (next: Units) => {
    void setPrefs({ units: next }).catch((error: unknown) => {
      logger.warn("Failed to persist units preference", { error });
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
        <SectionHead title="Units" />
        <Segmented
          options={UNIT_OPTIONS}
          value={units}
          onChange={handleUnits}
          ariaLabel="Units"
        />
      </section>
      <section>
        <SectionHead title="Notifications" />
        <NotificationsRow
          enabled={prefs?.notificationsEnabled ?? false}
          onChange={handleNotifications}
        />
      </section>
    </div>
  );
};
