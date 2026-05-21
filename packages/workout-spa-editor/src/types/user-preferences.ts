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

export const calendarViewSchema = z.enum(["grid", "list"]);

export type CalendarView = z.infer<typeof calendarViewSchema>;

export const userPreferencesSchema = z.object({
  profileId: z.string().min(1),
  calendarView: calendarViewSchema,
  updatedAt: z.iso.datetime(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
