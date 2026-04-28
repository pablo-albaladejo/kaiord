/**
 * useActiveProfile — React hook returning the active profile.
 *
 * Wraps the existing Zustand `useProfileStore` (which mirrors the persisted
 * `meta.activeProfileId` + `profiles` table). This hook is framework-coupled
 * by design (D7) and lives outside the application layer; the pure version
 * is `application/profile/get-active-profile.ts`.
 */

import { useProfileStore } from "../store/profile-store";
import type { Profile } from "../types/profile";

export type UseActiveProfile = {
  id: string | null;
  profile: Profile | null;
};

export const useActiveProfile = (): UseActiveProfile => {
  const id = useProfileStore((s) => s.activeProfileId);
  const profile = useProfileStore(
    (s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null
  );
  return { id, profile };
};
