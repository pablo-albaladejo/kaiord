import { db } from "../adapters/dexie/dexie-database";
import type { CapabilityId } from "../lib/capabilities/capability-catalogue";

export const CAPABILITY_TEST_PROFILE_ID =
  "00000000-0000-4000-8000-0000000ca9ab";

/** Makes an athlete active in the Dexie test database with these Capabilities on. */
export async function seedCapabilities(
  on: readonly CapabilityId[],
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
  await db.table("capabilityDecisions").bulkPut(
    on.map((capabilityId) => ({
      profileId,
      capabilityId,
      on: true,
      updatedAt: now,
    }))
  );
}

/** Forgets every athlete and decision `seedCapabilities` wrote. */
export async function clearCapabilities(): Promise<void> {
  await Promise.all(
    ["profiles", "meta", "capabilityDecisions"].map((name) =>
      db.table(name).clear()
    )
  );
}
