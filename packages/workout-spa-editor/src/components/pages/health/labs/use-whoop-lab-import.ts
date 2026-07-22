/**
 * useWhoopLabImport — drives the user-initiated WHOOP biomarker import
 * (design D6). The affordance is visible only once the whoop-bridge
 * extension is discovered AND its captured session reports connected;
 * unlike `useWhoopSync` this never auto-fires — only an explicit click runs
 * `importWhoopLabs` against the active profile, then toasts the outcome. A
 * successful import writes through the REAL Dexie persistence, so the
 * reactive `useLiveQuery` history list refreshes on its own.
 */
import { useEffect, useState } from "react";

import { bridgeDiscovery } from "../../../../adapters/bridge/bridge-discovery";
import {
  readWhoopFetch,
  readWhoopStatus,
} from "../../../../adapters/bridge/whoop-transport";
import { importWhoopLabs } from "../../../../application/whoop/import-whoop-labs.use-case";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { useDiscoveredBridges } from "../../../../hooks/use-discovered-bridges";
import { useTranslate } from "../../../../i18n/use-translate";

const WHOOP_BRIDGE_ID = "whoop-bridge";

const useWhoopConnected = (isDiscovered: boolean): boolean => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const extensionId = isDiscovered
      ? bridgeDiscovery.getExtensionId(WHOOP_BRIDGE_ID)
      : null;
    if (!extensionId) {
      setConnected(false);
      return;
    }
    let cancelled = false;
    readWhoopStatus(extensionId)
      .then((status) => {
        if (!cancelled) setConnected(status.connected && status.userId != null);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDiscovered]);

  return connected;
};

export function useWhoopLabImport() {
  const t = useTranslate("labImport");
  const toast = useToastContext();
  const persistence = usePersistence();
  const active = useActiveProfileLive();
  const discovered = useDiscoveredBridges();
  const isDiscovered = discovered.some((d) => d.bridgeId === WHOOP_BRIDGE_ID);
  const connected = useWhoopConnected(isDiscovered);
  const [isRunning, setIsRunning] = useState(false);

  const run = async () => {
    const extensionId = bridgeDiscovery.getExtensionId(WHOOP_BRIDGE_ID);
    const profileId = active?.id;
    if (!extensionId || !profileId) return;
    setIsRunning(true);
    try {
      const result = await importWhoopLabs({
        persistence,
        fetchLabs: (path) => readWhoopFetch(extensionId, path),
        profileId,
        sex: active.profile?.sex,
      });
      if (!result.ok) toast.error(t("whoopImportFailed"));
      else
        toast.success(
          t("whoopImportedToast", {
            imported: result.imported,
            skipped: result.skipped,
          })
        );
    } catch {
      toast.error(t("whoopImportFailed"));
    } finally {
      setIsRunning(false);
    }
  };

  return { canImport: connected, isRunning, run };
}
