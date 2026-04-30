/**
 * Shared fixture helpers for application/profile/*.test.ts.
 *
 * Test-only — exported as plain factories so each test file can
 * compose its own setup against `createInMemoryPersistence()` (D5.1
 * use-case unit-test pattern).
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { Profile, SportKey, SportZoneConfig } from "../../types/profile";
import { DEFAULT_HEART_RATE_ZONES } from "../../types/profile";

export const NOW = "2026-04-29T00:00:00.000Z";

// Each sport gets its own clone of DEFAULT_HEART_RATE_ZONES so a test
// that mutates one profile's HR zones cannot leak into another sport
// (or another fresh profile via `makeProfile()`).
const cloneHrZones = () => DEFAULT_HEART_RATE_ZONES.map((z) => ({ ...z }));

const baseSportZones = (): Record<SportKey, SportZoneConfig> => ({
  cycling: {
    thresholds: {},
    heartRateZones: { method: "custom", zones: cloneHrZones() },
    powerZones: { method: "custom", zones: [] },
  },
  running: {
    thresholds: {},
    heartRateZones: { method: "custom", zones: cloneHrZones() },
    powerZones: { method: "custom", zones: [] },
    paceZones: { method: "custom", zones: [] },
  },
  swimming: {
    thresholds: {},
    heartRateZones: { method: "custom", zones: cloneHrZones() },
    paceZones: { method: "custom", zones: [] },
  },
  generic: {
    thresholds: {},
    heartRateZones: { method: "custom", zones: cloneHrZones() },
  },
});

export const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: overrides.id ?? "00000000-0000-4000-8000-0000000000d1",
  name: overrides.name ?? "Test Profile",
  sportZones: overrides.sportZones ?? baseSportZones(),
  linkedAccounts: overrides.linkedAccounts ?? [],
  createdAt: overrides.createdAt ?? NOW,
  updatedAt: overrides.updatedAt ?? NOW,
  bodyWeight: overrides.bodyWeight,
});

export const seedProfile = async (
  persistence: PersistencePort,
  profile: Profile
): Promise<void> => {
  await persistence.profiles.put(profile);
};
