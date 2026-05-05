/**
 * Profile Storage Types & Schema
 *
 * Storage state schema and error union for the localStorage profile
 * adapter. Co-located with `profile-storage.ts` but split out so the
 * adapter stays under the per-file line cap.
 */

import { z } from "zod";

import { profileSchema } from "../types/profile";

export const STORAGE_KEY = "workout-spa-profiles";
export const ACTIVE_PROFILE_KEY = "workout-spa-active-profile";

/** Validates the complete storage state structure. */
export const storageStateSchema = z.object({
  profiles: z.array(profileSchema),
  activeProfileId: z.uuid().nullable(),
});

export type StorageState = z.infer<typeof storageStateSchema>;

/** Storage error union returned by save/load operations. */
export type StorageError =
  | { type: "quota_exceeded"; message: string }
  | { type: "parse_error"; message: string }
  | { type: "unknown_error"; message: string };
