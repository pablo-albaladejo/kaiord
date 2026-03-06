/**
 * Mode to Method Migration
 *
 * Converts old `mode: "auto"|"manual"` to `method` field.
 */

export function migrateModeToMethod<T extends Record<string, unknown>>(
  profile: T
): T {
  const sportZones = profile["sportZones"] as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!sportZones) return profile;

  let changed = false;
  const updated = { ...sportZones };

  for (const [sport, config] of Object.entries(updated)) {
    const migrated = migrateConfigModes(config);
    if (migrated !== config) {
      updated[sport] = migrated;
      changed = true;
    }
  }

  return changed ? { ...profile, sportZones: updated } : profile;
}

function migrateConfigModes(
  config: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...config };
  for (const key of ["heartRateZones", "powerZones", "paceZones"]) {
    const zc = result[key] as Record<string, unknown> | undefined;
    if (zc && "mode" in zc && !("method" in zc)) {
      const method = zc["mode"] === "auto" ? "karvonen-5" : "custom";
      const rest = Object.fromEntries(
        Object.entries(zc).filter(([k]) => k !== "mode")
      );
      result[key] = { ...rest, method };
    }
  }
  return result;
}
