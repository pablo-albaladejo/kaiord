/**
 * SportZoneEditor Component
 *
 * Sport-specific zone editor with tabs and zone sections. Thresholds are
 * not edited here: they have one home, the Athlete page; the caller passes
 * what to show for them in `thresholds`.
 */

import type { ReactNode } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { SportKey } from "../../../types/sport-zones";
import { ConfirmationModal } from "../../molecules/ConfirmationModal/ConfirmationModal";
import { SportZoneSections } from "./components/SportZoneSections";
import { SportZoneTabs } from "./components/SportZoneTabs";
import { useSportZoneEditor } from "./hooks/useSportZoneEditor";

type SportZoneEditorProps = {
  profileId: string;
  /** The tab to open on — the sport the athlete was looking at. */
  initialSport?: SportKey;
  /** Told when the athlete picks another sport's tab. */
  onSportChange?: (sport: SportKey) => void;
  /** What the zones derive from, shown above them. */
  thresholds?: ReactNode;
};

export function SportZoneEditor({
  profileId,
  initialSport,
  onSportChange,
  thresholds,
}: SportZoneEditorProps) {
  const t = useTranslate("zones");
  const {
    activeSport,
    setActiveSport,
    saved,
    sportConfig,
    capabilities,
    confirmMethod,
    handleMethodChange,
    confirmMethodSwitch,
    cancelMethodSwitch,
    handleZonesChange,
    handleAddZone,
  } = useSportZoneEditor(profileId, initialSport);

  const handleSportChange = (sport: SportKey) => {
    setActiveSport(sport);
    onSportChange?.(sport);
  };

  // A sport with no config yet keeps its tabs and thresholds, so it is not
  // a dead end: setting a threshold creates the config.
  return (
    <div className="space-y-4">
      <SportZoneTabs
        activeSport={activeSport}
        onSportChange={handleSportChange}
      />
      {thresholds}
      {sportConfig ? (
        <SportZoneSections
          config={sportConfig}
          capabilities={capabilities}
          onMethodChange={handleMethodChange}
          onZonesChange={handleZonesChange}
          onAddZone={handleAddZone}
          ftp={sportConfig.thresholds.ftp}
        />
      ) : (
        <p className="text-sm text-ink-muted">{t("empty.noSportConfig")}</p>
      )}
      <p role="status" className="text-xs text-ink-muted">
        {saved ? t("status.saved") : ""}
      </p>
      <ConfirmationModal
        isOpen={!!confirmMethod}
        title={t("method.confirmTitle")}
        message={t("method.confirmMessage")}
        confirmLabel={t("method.confirmLabel")}
        cancelLabel={t("method.keepLabel")}
        onConfirm={confirmMethodSwitch}
        onCancel={cancelMethodSwitch}
        variant="default"
      />
    </div>
  );
}
