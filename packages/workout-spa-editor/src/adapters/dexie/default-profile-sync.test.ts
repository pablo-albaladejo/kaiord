/**
 * Default (auto) profile through the real sync pipeline: Dexie on both
 * devices, a shared in-memory cloud whose `push` rejects any `origin:"auto"`
 * profile (so every case here also asserts that invariant).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { createProfile } from "../../application/profile/create-profile";
import { ensureDefaultProfile } from "../../application/profile/ensure-default-profile";
import { AUTO_PROFILE_CHOICE_KEY } from "../../application/sync/reconcile-auto-profile";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import type { SnapshotPort } from "../../ports/snapshot-port";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import { createAppPersistence } from "../create-app-persistence";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const names: string[] = [];
const open = async (label: string) => {
  const name = `kaiord-test-autoprofile-${label}-${Date.now()}-${Math.random()}`;
  names.push(name);
  const db = new KaiordDatabase(name);
  await db.open();
  return {
    db,
    persistence: createAppPersistence(db),
    snapshotPort: createDexieSnapshotPort(db),
  };
};

const newCloud = () =>
  createInMemoryCloudSyncPort({
    authenticated: true,
    snapshot: null,
    revision: null,
    pushCount: 0,
  });

const sync = (cloud: CloudSyncPort, snapshotPort: SnapshotPort, id: string) =>
  syncWithCloud({ cloud, snapshotPort, deviceId: id });

const dump = async (db: KaiordDatabase) => {
  const out: Record<string, unknown[]> = {};
  for (const table of db.tables) out[table.name] = await table.toArray();
  return out;
};

/** First boot on device A: the auto profile plus one row of each kind. */
const firstBoot = async () => {
  const a = await open("a");
  const auto = await ensureDefaultProfile(a.persistence, "Mi perfil");
  if (!auto) throw new Error("auto profile not created");
  const p = auto.id;
  await a.db.table("workouts").put({
    id: "w-1",
    profileId: p,
    date: "2026-10-05",
    sourceId: `${p}:raw-1`,
    updatedAt: "2026-10-05T08:00:00.000Z",
  });
  await a.db.table("coachingDayNotes").put({
    id: `${p}:train2go:2026-10-05`,
    profileId: p,
    source: "train2go",
    date: "2026-10-05",
    updatedAt: "2026-10-05T08:00:00.000Z",
  });
  await a.db.table("intakeEntries").put({
    id: "i-1",
    profileId: p,
    date: "2026-10-05",
    kcal: 500,
  });
  await a.db.table("coachingSyncState").put({
    source: "train2go",
    profileId: p,
    lastSyncedAt: "2026-10-05T08:00:00.000Z",
  });
  return { ...a, autoId: p };
};

/** Device B pushes `count` real profiles to the shared cloud. */
const remoteWith = async (cloud: CloudSyncPort, count: number) => {
  const b = await open("b");
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1)
    ids.push((await createProfile(b.persistence, `Real ${i}`)).id);
  await sync(cloud, b.snapshotPort, "dev-b");
  return ids;
};

afterEach(async () => {
  for (const name of names.splice(0)) await Dexie.delete(name);
});

describe("default profile sync", () => {
  it("should re-key every auto row onto the single remote profile and never push the auto", async () => {
    // Arrange
    const cloud = newCloud();
    const [target] = await remoteWith(cloud, 1);
    const a = await firstBoot();

    // Act
    const result = await sync(cloud, a.snapshotPort, "dev-a");

    // Assert
    expect(result.revision).not.toBeNull();
    const profiles = await a.db.table("profiles").toArray();
    expect(profiles.map((r) => r.id)).toEqual([target]);
    expect(await a.db.table("workouts").get("w-1")).toMatchObject({
      profileId: target,
      sourceId: `${target}:raw-1`,
    });
    expect(
      await a.db.table("coachingDayNotes").get(`${target}:train2go:2026-10-05`)
    ).toMatchObject({ profileId: target });
    expect(await a.db.table("intakeEntries").get("i-1")).toMatchObject({
      profileId: target,
    });
    expect(await a.db.table("coachingSyncState").count()).toBe(0);
    expect(await a.db.table("meta").get("activeProfileId")).toMatchObject({
      value: target,
    });
    expect(JSON.stringify(await dump(a.db))).not.toContain(a.autoId);
    expect(JSON.stringify(cloud.state.snapshot)).not.toContain(a.autoId);
  });

  it("should not re-key twice or duplicate rows when the attempt retries after a moved revision", async () => {
    // Arrange
    const cloud = newCloud();
    const [target] = await remoteWith(cloud, 1);
    const a = await firstBoot();
    let moved = false;
    const racing: CloudSyncPort = {
      ...cloud,
      push: async (snapshot, expected) => {
        if (!moved) {
          moved = true;
          cloud.state.revision = `${cloud.state.revision}-moved`;
        }
        return cloud.push(snapshot, expected);
      },
    };

    // Act
    const result = await sync(racing, a.snapshotPort, "dev-a");

    // Assert
    expect(moved).toBe(true);
    expect(result.revision).not.toBeNull();
    expect(await a.db.table("profiles").count()).toBe(1);
    expect(await a.db.table("workouts").count()).toBe(1);
    expect(await a.db.table("coachingDayNotes").count()).toBe(1);
    expect(await a.db.table("intakeEntries").get("i-1")).toMatchObject({
      profileId: target,
    });
    expect(JSON.stringify(cloud.state.snapshot)).not.toContain(a.autoId);
  });

  it("should leave Dexie untouched and push nothing for two needsChoice cycles, then land rows on the chosen profile", async () => {
    // Arrange
    const cloud = newCloud();
    const [, chosen] = await remoteWith(cloud, 2);
    const a = await firstBoot();
    const before = await dump(a.db);
    const pushesBefore = cloud.state.pushCount;

    // Act
    const first = await sync(cloud, a.snapshotPort, "dev-a");
    const second = await sync(cloud, a.snapshotPort, "dev-a");
    const untouched = await dump(a.db);
    const pushesWhilePending = cloud.state.pushCount;
    await a.snapshotPort.writeMeta(AUTO_PROFILE_CHOICE_KEY, chosen);
    const resolved = await sync(cloud, a.snapshotPort, "dev-a");

    // Assert
    expect(first.needsChoice).toHaveLength(2);
    expect(second.needsChoice).toEqual(first.needsChoice);
    expect(pushesWhilePending).toBe(pushesBefore);
    expect(untouched).toEqual(before);
    expect(resolved.revision).not.toBeNull();
    expect(await a.db.table("profiles").count()).toBe(2);
    expect(await a.db.table("workouts").get("w-1")).toMatchObject({
      profileId: chosen,
    });
    expect(await a.db.table("intakeEntries").get("i-1")).toMatchObject({
      profileId: chosen,
    });
    expect(
      await a.db.table("meta").get(AUTO_PROFILE_CHOICE_KEY)
    ).toBeUndefined();
    expect(JSON.stringify(cloud.state.snapshot)).not.toContain(a.autoId);
  });

  it("should claim the auto profile and push it when the remote has no real profile", async () => {
    // Arrange
    const cloud = newCloud();
    const a = await firstBoot();

    // Act
    await sync(cloud, a.snapshotPort, "dev-a");

    // Assert
    expect(await a.db.table("profiles").get(a.autoId)).toMatchObject({
      origin: "local",
    });
    const pushed = cloud.state.snapshot?.tables.profiles as Array<{
      id: string;
      origin?: string;
    }>;
    expect(pushed).toEqual([
      expect.objectContaining({ id: a.autoId, origin: "local" }),
    ]);
  });
});
