/**
 * UserPreferences — per-profile UI preferences.
 *
 * Lazily created: a Profile starts with no row; reads return defaults
 * derived by the caller (UI layer reads viewport width). The row is
 * upserted on first user-driven mutation.
 *
 * `updatedAt` is sourced from an injected clock to keep tests deterministic.
 */

import { z } from "zod";

export const calendarDensitySchema = z.enum(["compact", "comfortable"]);

export type CalendarDensity = z.infer<typeof calendarDensitySchema>;

export const userPreferencesSchema = z.object({
  profileId: z.string().min(1),
  calendarDensity: calendarDensitySchema,
  updatedAt: z.iso.datetime(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
