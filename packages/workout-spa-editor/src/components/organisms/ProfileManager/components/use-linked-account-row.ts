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
      // PII rule: toast strings reference Kaiord profile name only;
      // never externalUserName / externalUserId.
      toasts.success(`Linked ${sourceMeta.label} to ${profile.name}`);
    } finally {
      setBusy(false);
    }
  }, [t2gSource, profile, sourceMeta, toasts]);

  const handleDisconnect = useCallback(async () => {
    abortRef.current?.abort();
    setBusy(true);
    try {
      await unlinkAccount(persistence.profiles, profile.id, sourceMeta.id);
      toasts.info(`Disconnected ${sourceMeta.label}`);
      analytics.event("coaching.unlink.success", { source: sourceMeta.id });
    } finally {
      setBusy(false);
    }
  }, [persistence, profile, sourceMeta, toasts, analytics]);

  return { busy, handleConnect, handleDisconnect };
};
