/**
 * DevicePreferences — choices that describe the person reading this screen
 * on this browser, not the athlete: language, units and notifications.
 * Stored per device (see `lib/device-preferences`), never in the snapshot.
 */

import { z } from "zod";

import { localePreferenceSchema, unitsSchema } from "./user-preferences";

export const devicePreferencesSchema = z.object({
  units: unitsSchema.optional(),
  locale: localePreferenceSchema.optional(),
  notificationsEnabled: z.boolean().optional(),
});

export type DevicePreferences = z.infer<typeof devicePreferencesSchema>;

/** Keeps only the three device fields, dropping absent ones. */
export const pickDevicePreferences = (
  source: DevicePreferences | undefined
): DevicePreferences => {
  const picked: DevicePreferences = {};
  if (source?.units !== undefined) picked.units = source.units;
  if (source?.locale !== undefined) picked.locale = source.locale;
  if (source?.notificationsEnabled !== undefined)
    picked.notificationsEnabled = source.notificationsEnabled;
  return picked;
};
