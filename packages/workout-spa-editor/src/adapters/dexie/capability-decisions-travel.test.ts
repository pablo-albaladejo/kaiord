/**
 * A Capability decision belongs to the athlete, not to the browser: it rides
 * the Drive sync to their other device and the backup file into a clean
 * browser, through the real pipelines on two Dexie databases, and no older
 * build rewriting the preferences row can erase it.
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
import { readCapabilityInputs } from "../../hooks/use-capability-inputs-live";
import type { CapabilityId } from "../../lib/capabilities/capability-catalogue";
import { resolveCapabilities } from "../../lib/capabilities/resolve-capabilities";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import type { UserPreferences } from "../../types/user-preferences";
import { createAppPersistence } from "../create-app-persistence";
import type { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const databases = {
  a: sharedKaiordDatabase("capabilities-a"),
  b: sharedKaiordDatabase("capabilities-b"),
};

type Device = Awaited<ReturnType<typeof open>>;

const open = async (label: keyof typeof databases) => {
  const db = databases[label];
  await db.open();
  return {
    db,
    label,
    persistence: createAppPersistence(db),
    snapshotPort: createDexieSnapshotPort(db),
  };
};

const decide = (
  device: Device,
  profileId: string,
  id: CapabilityId,
  on: boolean,
  at: string
) =>
  setCapability(
    { profileId, id, on },
    { ...device.persistence, clock: () => at }
  );

/** Device B: a real athlete who activated Templates and kept one. */
const athleteWithTemplates = async () => {
  const b = await open("b");
  const { id } = await createProfile(b.persistence, "Ana");
  await b.db.table("meta").put({ key: "activeProfileId", value: id });
  await decide(b, id, "templates", true, "2026-11-23T09:00:00.000Z");
  await b.db.table("templates").put({ id: "t-b", name: "Tempo", sport: "run" });
  return { ...b, profileId: id };
};

const isOn = async (device: Device, id: CapabilityId) => {
  const live = await readCapabilityInputs(device.db);
  return resolveCapabilities(live.inputs).isOn(id);
};

/**
 * The preferences write of every build before Capability decisions had a
 * store of their own: it rebuilds the row from a fixed list of fields, so
 * anything else on the row is dropped (copied from 7e104f062).
 */
const olderBuildSetsCalendarView = async (
  db: KaiordDatabase,
  profileId: string,
  at: string
) => {
  const existing = await db
    .table<UserPreferences>("userPreferences")
    .get(profileId);
  await db.table("userPreferences").put({
    profileId,
    calendarView: "list",
    lastScratchSport: existing?.lastScratchSport,
    activeSport: existing?.activeSport,
    aiBannerExpanded: existing?.aiBannerExpanded,
    units: existing?.units,
    notificationsEnabled: existing?.notificationsEnabled,
    labDashboardParams: existing?.labDashboardParams,
    locale: existing?.locale,
    setupChecklistDismissed: existing?.setupChecklistDismissed,
    dismissedCoachMarks: existing?.dismissedCoachMarks,
    updatedAt: at,
  });
};

const freshCloud = () =>
  createInMemoryCloudSyncPort({
    authenticated: true,
    snapshot: null,
    revision: null,
    pushCount: 0,
  });

const sync = (cloud: ReturnType<typeof freshCloud>, device: Device) =>
  syncWithCloud({
    cloud,
    snapshotPort: device.snapshotPort,
    deviceId: `dev-${device.label}`,
  });

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
    expect(
      await a.persistence.capabilityDecisions.listByProfile(b.profileId)
    ).toEqual([
      expect.objectContaining({ capabilityId: "templates", on: true }),
    ]);
    expect(await a.db.table("templates").get("t-b")).toBeDefined();
  });

  it("should sync to the athlete's other device", async () => {
    // Arrange
    const b = await athleteWithTemplates();
    const cloud = freshCloud();
    await sync(cloud, b);
    const a = await open("a");

    // Act
    await sync(cloud, a);

    // Assert
    expect(
      await a.persistence.capabilityDecisions.listByProfile(b.profileId)
    ).toEqual([
      expect.objectContaining({ capabilityId: "templates", on: true }),
    ]);
  });

  it("should keep Templates off when an older build later rewrites the preferences row", async () => {
    // Arrange
    const b = await athleteWithTemplates();
    await decide(
      b,
      b.profileId,
      "templates",
      false,
      "2026-11-23T10:00:00.000Z"
    );
    const cloud = freshCloud();
    await sync(cloud, b);
    const old = await open("a");
    await sync(cloud, old);
    await old.db
      .table("meta")
      .put({ key: "activeProfileId", value: b.profileId });

    // Act
    await olderBuildSetsCalendarView(
      old.db,
      b.profileId,
      "2026-11-23T11:00:00.000Z"
    );
    await sync(cloud, old);
    await sync(cloud, b);

    // Assert
    const prefs = await b.db.table("userPreferences").get(b.profileId);
    expect(prefs?.calendarView).toBe("list");
    expect(await isOn(b, "templates")).toBe(false);
    expect(await isOn(old, "templates")).toBe(false);
  });

  it("should keep the matrix off when an older build later rewrites the preferences row", async () => {
    // Arrange
    const b = await athleteWithTemplates();
    await b.db.table("dataTypeSourcePolicy").put({
      profileId: b.profileId,
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["train2go-bridge"],
    });
    await decide(
      b,
      b.profileId,
      "authority-matrix",
      false,
      "2026-11-23T10:00:00.000Z"
    );
    const cloud = freshCloud();
    await sync(cloud, b);
    const old = await open("a");
    await sync(cloud, old);

    // Act
    await olderBuildSetsCalendarView(
      old.db,
      b.profileId,
      "2026-11-23T11:00:00.000Z"
    );
    await sync(cloud, old);
    await sync(cloud, b);

    // Assert
    expect(await isOn(b, "authority-matrix")).toBe(false);
  });
});
