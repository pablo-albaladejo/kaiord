/**
 * UserPreferences — per-profile UI preferences.
 *
 * Lazily created: a Profile starts with no row; reads return defaults
 * derived by the caller (UI layer reads viewport width). The row is
 * upserted on first user-driven mutation.
 *
 * `updatedAt` is sourced from an injected clock to keep tests deterministic.
 */

import { sportSchema } from "@kaiord/core";
import { z } from "zod";

export const calendarViewSchema = z.enum(["grid", "list"]);

export type CalendarView = z.infer<typeof calendarViewSchema>;

export const unitsSchema = z.enum(["metric", "imperial"]);

export type Units = z.infer<typeof unitsSchema>;

export const userPreferencesSchema = z.object({
  profileId: z.string().min(1),
  calendarView: calendarViewSchema,
  // Optional: pre-v15 rows lack these fields. The Dexie v15 migration is
  // data-only; absence remains a valid state until the user first writes.
  lastScratchSport: sportSchema.optional(),
  /** Sport last selected on the Athlete page; absent until first chosen. */
  activeSport: sportSchema.optional(),
  aiBannerExpanded: z.boolean().optional(),
  /** Measurement system for display only; absent defaults to metric. */
  units: unitsSchema.optional(),
  /** User intent to enable browser notifications; absent defaults to off. */
  notificationsEnabled: z.boolean().optional(),
  updatedAt: z.iso.datetime(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
