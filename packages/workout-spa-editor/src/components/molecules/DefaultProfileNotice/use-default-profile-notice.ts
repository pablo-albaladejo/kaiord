import { useCallback, useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";

export const DEFAULT_PROFILE_NOTICE_STORAGE_KEY =
  "kaiord.defaultProfileNotice.dismissed";

const readDismissed = (): string[] => {
  try {
    const raw = localStorage.getItem(DEFAULT_PROFILE_NOTICE_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

const writeDismissed = (ids: string[]): void => {
  try {
    localStorage.setItem(
      DEFAULT_PROFILE_NOTICE_STORAGE_KEY,
      JSON.stringify(ids)
    );
  } catch {
    // Storage may be unavailable (private mode); the dismissal still holds
    // for this session.
  }
};

/**
 * Visible while the active profile is the unclaimed default one and the
 * notice was not dismissed on this device. Dismissal is device-local on
 * purpose: the default profile itself never leaves the device, and a
 * synced preferences write would carry a fresh `updatedAt` that, once the
 * profile is re-keyed onto a synced one, wins LWW over that profile's whole
 * preferences row. It is not a profile edit either, so it does not claim.
 */
export function useDefaultProfileNotice() {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const [dismissed, setDismissed] = useState(readDismissed);
  const visible =
    active?.profile?.origin === "auto" &&
    profileId !== null &&
    !dismissed.includes(profileId);

  const dismiss = useCallback(() => {
    if (profileId === null) return;
    setDismissed((ids) => {
      const next = [...new Set([...ids, profileId])];
      writeDismissed(next);
      return next;
    });
  }, [profileId]);

  return { visible, dismiss };
}
