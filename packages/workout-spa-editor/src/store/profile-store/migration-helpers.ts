/**
 * Migration Helper Functions
 *
 * Utilities for building sport zone configs during migration.
 */

import { DEFAULT_HEART_RATE_ZONES } from "../../types/profile-defaults";
import { calculateHrZones } from "../../utils/calculate-hr-zones";
import type { SportZoneConfig } from "../../types/sport-zones";

/**
 * Build an empty sport zone config with optional LTHR
 */
export const buildEmptySportConfig = (lthr?: number): SportZoneConfig => ({
  thresholds: { lthr },
  heartRateZones: {
    method: lthr ? "karvonen-5" : "custom",
    zones: lthr ? calculateHrZones(lthr) : DEFAULT_HEART_RATE_ZONES,
  },
});
