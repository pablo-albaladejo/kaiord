import type { Profile } from "../../../types/profile";

/** An edited default profile becomes a real one; any other passes through. */
export const claimProfile = (profile: Profile): Profile =>
  profile.origin === "auto" ? { ...profile, origin: "local" } : profile;

export const isAutoProfile = (profile: { origin?: unknown }): boolean =>
  profile.origin === "auto";
