/**
 * Hook for LinkedAccountRow connect/disconnect handlers.
 * Extracted to keep LinkedAccountsSection.tsx under the lint limit.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useTrain2GoSource } from "../../../../adapters/train2go/use-train2go-source";
import { unlinkAccount } from "../../../../application/coaching/unlink-account";
import { useAnalytics } from "../../../../contexts";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useDiscoveredBridges } from "../../../../hooks/use-discovered-bridges";
import { useTranslate } from "../../../../i18n/use-translate";
import type { Profile } from "../../../../types/profile";

export type SourceMeta = {
  id: string;
  label: string;
  bridgeId: string;
};

export const useLinkedAccountRow = (
  profile: Profile,
  sourceMeta: SourceMeta
) => {
  const persistence = usePersistence();
  const toasts = useToastContext();
  const analytics = useAnalytics();
  const t = useTranslate("athlete");
  const extensionMissing = !useDiscoveredBridges().some(
    (bridge) => bridge.bridgeId === sourceMeta.bridgeId
  );
  const t2gSource = useTrain2GoSource(profile.id, []);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleConnect = useCallback(async () => {
    abortRef.current?.abort();
    if (extensionMissing) {
      toasts.error(
        t("profileManager.toast.extensionMissing", { source: sourceMeta.label })
      );
      return;
    }
    setBusy(true);
    try {
      await t2gSource.connect(profile.id);
      const refreshed = await persistence.profiles.getById(profile.id);
      const linked = refreshed?.linkedAccounts.some(
        (a) => a.source === sourceMeta.id
      );
      if (!linked) return;
      toasts.success(t("profileManager.toast.accountLinked"));
    } finally {
      setBusy(false);
    }
  }, [
    t2gSource,
    persistence,
    profile,
    sourceMeta,
    toasts,
    extensionMissing,
    t,
  ]);

  const handleDisconnect = useCallback(async () => {
    abortRef.current?.abort();
    setBusy(true);
    try {
      await unlinkAccount(persistence.profiles, profile.id, sourceMeta.id);
      toasts.info(t("profileManager.toast.accountDisconnected"));
      analytics.event("coaching.unlink.success", { source: sourceMeta.id });
    } finally {
      setBusy(false);
    }
  }, [persistence, profile, sourceMeta, toasts, analytics, t]);

  return { busy, extensionMissing, handleConnect, handleDisconnect };
};
