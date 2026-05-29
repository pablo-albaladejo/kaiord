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
import type { ProfileRepository } from "../../../../ports/persistence-port";
import type { Profile } from "../../../../types/profile";

export type SourceMeta = {
  id: string;
  label: string;
};

const ACCOUNT_LINKED_TOAST = "Coaching account linked";
const ACCOUNT_DISCONNECTED_TOAST = "Coaching account disconnected";

// TODO(PR 6): replace with IntegrationPolicy(direction='import',dataType='training-zones')
const writeSyncZones = async (
  repo: ProfileRepository,
  profileId: string,
  sourceId: string,
  next: boolean
): Promise<void> => {
  const refreshed = await repo.getById(profileId);
  if (!refreshed) return;
  const linkedAccounts = refreshed.linkedAccounts.map((a) =>
    a.source === sourceId ? ({ ...a, syncZones: next } as typeof a) : a
  );
  await repo.put({
    ...refreshed,
    linkedAccounts,
    updatedAt: new Date().toISOString(),
  });
};

export const useLinkedAccountRow = (
  profile: Profile,
  sourceMeta: SourceMeta
) => {
  const persistence = usePersistence();
  const toasts = useToastContext();
  const analytics = useAnalytics();
  const t2gSource = useTrain2GoSource(profile.id, []);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleConnect = useCallback(async () => {
    abortRef.current?.abort();
    setBusy(true);
    try {
      await t2gSource.connect(profile.id);
      const refreshed = await persistence.profiles.getById(profile.id);
      const linked = refreshed?.linkedAccounts.some(
        (a) => a.source === sourceMeta.id
      );
      if (!linked) return;
      toasts.success(ACCOUNT_LINKED_TOAST);
    } finally {
      setBusy(false);
    }
  }, [t2gSource, persistence, profile, sourceMeta, toasts]);

  const handleDisconnect = useCallback(async () => {
    abortRef.current?.abort();
    setBusy(true);
    try {
      await unlinkAccount(persistence.profiles, profile.id, sourceMeta.id);
      toasts.info(ACCOUNT_DISCONNECTED_TOAST);
      analytics.event("coaching.unlink.success", { source: sourceMeta.id });
    } finally {
      setBusy(false);
    }
  }, [persistence, profile, sourceMeta, toasts, analytics]);

  const handleToggleSyncZones = useCallback(
    async (next: boolean) =>
      writeSyncZones(persistence.profiles, profile.id, sourceMeta.id, next),
    [persistence, profile, sourceMeta]
  );

  return { busy, handleConnect, handleDisconnect, handleToggleSyncZones };
};
