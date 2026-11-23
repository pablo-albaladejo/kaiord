/**
 * A Capability decision belongs to the athlete, not to the browser: it rides
 * the Drive sync to their other device and the backup file into a clean
 * browser, through the real pipelines on two Dexie databases.
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { exportBackup } from "../../application/backup/export-backup";
import { importBackup } from "../../application/backup/import-backup";
import { parseBackup } from "../../application/backup/parse-backup";
import { setCapability } from "../../application/capabilities/set-capability";
import { createProfile } from "../../application/profile/create-profile";
import { ensureDefaultProfile } from "../../application/profile/ensure-default-profile";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { createAppPersistence } from "../create-app-persistence";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";
import { createDexieUserPreferencesRepository } from "./dexie-user-preferences-repository";

const databases = {
  a: sharedKaiordDatabase("capabilities-a"),
  b: sharedKaiordDatabase("capabilities-b"),
};

const open = async (label: keyof typeof databases) => {
  const db = databases[label];
  await db.open();
  return {
    db,
    persistence: createAppPersistence(db),
    snapshotPort: createDexieSnapshotPort(db),
  };
};

/** Device B: a real athlete who activated Templates and kept one. */
const athleteWithTemplates = async () => {
  const b = await open("b");
  const { id } = await createProfile(b.persistence, "Ana");
  await setCapability(
    { profileId: id, id: "templates", on: true },
    {
      clock: () => "2026-11-23T09:00:00.000Z",
      repository: createDexieUserPreferencesRepository(b.db),
      profileRepository: b.persistence.profiles,
    }
  );
  await b.db.table("templates").put({ id: "t-b", name: "Tempo", sport: "run" });
  return { ...b, profileId: id };
};

const decisionsOn = async (label: keyof typeof databases, id: string) =>
  (await databases[label].table("userPreferences").get(id))?.capabilities;

describe("Capability decisions", () => {
  it("should ride the backup file into a clean browser", async () => {
    // Arrange
    const b = await athleteWithTemplates();
    const file = JSON.stringify(
      await exportBackup({ port: b.snapshotPort, deviceId: "dev-b" })
    );
    const a = await open("a");
    await ensureDefaultProfile(a.persistence, "Mi perfil");

    // Act
    await importBackup({
      port: a.snapshotPort,
      deviceId: "dev-a",
      backup: parseBackup(file),
    });

    // Assert
    expect(await decisionsOn("a", b.profileId)).toEqual({ templates: true });
    expect(await a.db.table("templates").get("t-b")).toBeDefined();
  });

  it("should sync to the athlete's other device", async () => {
    // Arrange
    const b = await athleteWithTemplates();
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    await syncWithCloud({
      cloud,
      snapshotPort: b.snapshotPort,
      deviceId: "dev-b",
    });
    const a = await open("a");

    // Act
    await syncWithCloud({
      cloud,
      snapshotPort: a.snapshotPort,
      deviceId: "dev-a",
    });

    // Assert
    expect(await decisionsOn("a", b.profileId)).toEqual({ templates: true });
  });
});
