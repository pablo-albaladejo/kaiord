import { db } from "../adapters/dexie/dexie-database";

export const CAPABILITY_TEST_PROFILE_ID =
  "00000000-0000-4000-8000-0000000ca9ab";

/** Makes an athlete active in the Dexie test database with these Capabilities on. */
export async function seedCapabilities(
  on: readonly string[],
  profileId = CAPABILITY_TEST_PROFILE_ID
): Promise<void> {
  const now = "2026-11-23T00:00:00.000Z";
  await db.table("profiles").put({
    id: profileId,
    name: "Athlete",
    sportZones: {},
    linkedAccounts: [],
    createdAt: now,
    updatedAt: now,
  });
  await db.table("meta").put({ key: "activeProfileId", value: profileId });
  await db.table("userPreferences").put({
    profileId,
    calendarView: "grid",
    capabilities: Object.fromEntries(on.map((id) => [id, true])),
    updatedAt: now,
  });
}

/** Forgets every athlete and decision `seedCapabilities` wrote. */
export async function clearCapabilities(): Promise<void> {
  await Promise.all(
    ["profiles", "meta", "userPreferences"].map((name) =>
      db.table(name).clear()
    )
  );
}
