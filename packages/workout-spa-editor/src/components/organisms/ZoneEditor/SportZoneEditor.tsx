/**
 * SportZoneEditor Component
 *
 * Sport-specific zone editor with tabs, thresholds, and zone sections.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { SportKey } from "../../../types/sport-zones";
import { ConfirmationModal } from "../../molecules/ConfirmationModal/ConfirmationModal";
import { SportZoneSections } from "./components/SportZoneSections";
import { SportZoneTabs } from "./components/SportZoneTabs";
import { SportZoneThresholds } from "./components/SportZoneThresholds";
import { useSportZoneEditor } from "./hooks/useSportZoneEditor";

type SportZoneEditorProps = {
  profileId: string;
  /** The tab to open on — the sport the athlete was looking at. */
  initialSport?: SportKey;
};

export function SportZoneEditor({
  profileId,
  initialSport,
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
    updateSportThresholds,
    handleZonesChange,
    handleAddZone,
  } = useSportZoneEditor(profileId, initialSport);

  if (!sportConfig) {
    return <p className="text-sm text-gray-500">{t("empty.noSportConfig")}</p>;
  }

  return (
    <div className="space-y-4">
      <SportZoneTabs activeSport={activeSport} onSportChange={setActiveSport} />
      <SportZoneThresholds
        thresholds={sportConfig.thresholds}
        capabilities={capabilities}
        onChange={(t) => updateSportThresholds(profileId, activeSport, t)}
      />
      <SportZoneSections
        config={sportConfig}
        capabilities={capabilities}
        onMethodChange={handleMethodChange}
        onZonesChange={handleZonesChange}
        onAddZone={handleAddZone}
        ftp={sportConfig.thresholds.ftp}
      />
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
