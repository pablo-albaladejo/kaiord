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
import type { Profile } from "../../../../types/profile";

export type SourceMeta = {
  id: string;
  label: string;
};

const ACCOUNT_LINKED_TOAST = "Coaching account linked";
const ACCOUNT_DISCONNECTED_TOAST = "Coaching account disconnected";

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
      // connect() returns void on abort / session-not-active / errors;
      // verify the link was actually persisted before claiming success.
      const refreshed = await persistence.profiles.getById(profile.id);
      const linked = refreshed?.linkedAccounts.some(
        (a) => a.source === sourceMeta.id
      );
      if (!linked) return;
      // Static toast string keeps user-typed and external-account fields
      // out of the user-facing message; the source/profile context is
      // already implicit from the row the user clicked.
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
    async (next: boolean) => {
      const refreshed = await persistence.profiles.getById(profile.id);
      if (!refreshed) return;
      const updatedAccounts = refreshed.linkedAccounts.map((a) =>
        a.source === sourceMeta.id ? { ...a, syncZones: next } : a
      );
      await persistence.profiles.put({
        ...refreshed,
        linkedAccounts: updatedAccounts,
        updatedAt: new Date().toISOString(),
      });
    },
    [persistence, profile, sourceMeta]
  );

  return {
    busy,
    handleConnect,
    handleDisconnect,
    handleToggleSyncZones,
    zonesSync: t2gSource.zonesSync,
  };
};
