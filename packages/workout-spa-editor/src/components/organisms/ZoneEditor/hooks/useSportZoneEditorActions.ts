/**
 * useSportZoneEditorActions
 *
 * Owns the application-use-case dispatch + toast surface for the
 * sport-zone editor so `useSportZoneEditor` stays under the
 * max-lines-per-function lint threshold while preserving a flat
 * top-level hook signature.
 */

import { useCallback, useState } from "react";

import { addCustomZone } from "../../../../application/profile/zones/add-custom-zone";
import { setZoneMethod } from "../../../../application/profile/zones/set-zone-method";
import { updateSportThresholds } from "../../../../application/profile/zones/update-sport-thresholds";
import { updateSportZones } from "../../../../application/profile/zones/update-sport-zones";
import type { ZoneType } from "../../../../application/profile/zones/zone-types";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useTranslate } from "../../../../i18n/use-translate";
import type { SportKey, SportThresholds } from "../../../../types/sport-zones";

export function useSportZoneEditorActions(
  profileId: string,
  activeSport: SportKey
) {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("zones");
  // Every edit autosaves; the athlete is told once the write has landed.
  const [saved, setSaved] = useState(false);

  const surface = useCallback(
    (run: () => Promise<unknown>) => {
      setSaved(false);
      void run().then(
        () => setSaved(true),
        () => toast.error(t("toast.updateFailed"))
      );
    },
    [toast, t]
  );

  const applyMethod = (
    zoneType: ZoneType,
    method: string,
    zones: Array<unknown>
  ) => {
    surface(() =>
      setZoneMethod(
        persistence,
        profileId,
        activeSport,
        zoneType,
        method,
        zones
      )
    );
  };

  const handleZonesChange = (zoneType: ZoneType, zones: Array<unknown>) => {
    surface(() =>
      updateSportZones(persistence, profileId, activeSport, zoneType, zones)
    );
  };

  const handleAddCustom = (zoneType: ZoneType, zone: unknown) => {
    surface(() =>
      addCustomZone(persistence, profileId, activeSport, zoneType, zone)
    );
  };

  const handleUpdateThresholds = (
    pid: string,
    sport: SportKey,
    thresholds: SportThresholds
  ) => {
    surface(() => updateSportThresholds(persistence, pid, sport, thresholds));
  };

  return {
    saved,
    applyMethod,
    handleZonesChange,
    handleAddCustom,
    handleUpdateThresholds,
  };
}
