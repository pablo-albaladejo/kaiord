/**
 * SportZoneEditor Component
 *
 * Sport-specific zone editor with tabs, thresholds, and zone sections.
 */

import { SportZoneSections } from "./components/SportZoneSections";
import { SportZoneTabs } from "./components/SportZoneTabs";
import { SportZoneThresholds } from "./components/SportZoneThresholds";
import { useSportZoneEditor } from "./hooks/useSportZoneEditor";
import { ConfirmationModal } from "../../molecules/ConfirmationModal/ConfirmationModal";

type SportZoneEditorProps = {
  profileId: string;
};

export function SportZoneEditor({ profileId }: SportZoneEditorProps) {
  const {
    activeSport,
    setActiveSport,
    sportConfig,
    capabilities,
    confirmToggle,
    handleToggleMode,
    confirmModeSwitch,
    cancelModeSwitch,
    updateSportThresholds,
  } = useSportZoneEditor(profileId);

  if (!sportConfig) {
    return (
      <p className="text-sm text-gray-500">
        No zone configuration for this sport.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        Training Zones
      </h3>
      <SportZoneTabs activeSport={activeSport} onSportChange={setActiveSport} />
      <SportZoneThresholds
        thresholds={sportConfig.thresholds}
        capabilities={capabilities}
        onChange={(t) => updateSportThresholds(profileId, activeSport, t)}
      />
      <SportZoneSections
        config={sportConfig}
        capabilities={capabilities}
        onToggleMode={handleToggleMode}
      />
      <ConfirmationModal
        isOpen={!!confirmToggle}
        title="Switch to Auto Mode"
        message="Switching to auto mode will replace your custom zones with calculated values. Continue?"
        confirmLabel="Switch to Auto"
        cancelLabel="Keep Manual"
        onConfirm={confirmModeSwitch}
        onCancel={cancelModeSwitch}
        variant="default"
      />
    </div>
  );
}
