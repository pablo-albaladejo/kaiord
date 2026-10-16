/**
 * Upgrade from every version ever shipped (v1..head) to today's schema with
 * the pruned `KaiordDatabase`. For each version, a real fake-indexeddb
 * database is created exactly as that release left it (declarations from the
 * frozen history) and filled with representative rows. Two copies are then
 * upgraded: one by `KaiordDatabase`, one by the full, unpruned history with
 * the same upgrade functions. Both must end with today's stores and indexes,
 * byte-identical rows, and every seeded row still present.
 *
 * Most starting versions are ones the pruned class no longer declares (e.g.
 * v23, between kept v22 and v25): Dexie diffs the installed schema straight to
 * the next kept version.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  captureKaiordRegistrations,
  cumulativeStores,
  HISTORY_HEAD,
  HISTORY_VERSIONS,
  historyRegistrations,
  registerFullHistory,
  type Registration,
} from "../../test-utils/kaiord-schema-history";
import { KaiordDatabase } from "./dexie-database";

type Row = Record<string, unknown>;

/** Versions whose upgrade reshapes the seed rows the assertions look at. */
const V_COACHING_TABLES = 4;
const V_DISMISSALS_CLEARED = 7;
const V_WORKOUT_PROFILE = 13;
const V_HEALTH_PROVENANCE = 17;
const V_DATA_HUB = 27;
const V_USAGE_CUTOVER = 33;
const UUID_SUFFIX_DIGITS = 12;
const PER_VERSION_TIMEOUT_MS = 30_000;

const DAY = "2026-05-04";
const AT = "2026-05-04T08:00:00.000Z";

/** Representative rows per table, shaped like the release at `version` wrote them. */
const seedRows = (version: number): Array<[string, Row]> => {
  const provenance = (externalId: string): Row =>
    version >= V_HEALTH_PROVENANCE
      ? { sourceBridgeId: "whoop-bridge", externalId, kaiordRecordId: "k" }
      : {};
  const health = (table: string): [string, Row] => [
    table,
    {
      id: `${table}-1`,
      profileId: "p1",
      date: DAY,
      value: 42,
      ...provenance(`${table}:${DAY}`),
    },
  ];
  return [
    ["meta", { key: "activeProfileId", value: "p1" }],
    [
      "profiles",
      {
        id: "p1",
        name: "Athlete",
        updatedAt: AT,
        linkedAccounts: [{ source: "train2go", syncZones: true }],
        sportZones: {
          cycling: {
            powerZones: { method: "manual", zones: [{ minPercent: 1 }] },
          },
        },
      },
    ],
    ["profiles", { id: "p2", name: "Legacy profile" }],
    [
      "workouts",
      {
        id: "w1",
        ...(version >= V_WORKOUT_PROFILE ? { profileId: "p1" } : {}),
        date: DAY,
        state: "completed",
        source: "train2go",
        sourceId: "p1:t2g-1",
        sport: "cycling",
        tags: ["tempo", "outdoor"],
        garminPushId: "g-1",
        updatedAt: AT,
      },
    ],
    ["templates", { id: "t1", sport: "running", tags: ["base"] }],
    ["aiProviders", { id: "ai1", model: "model-a", isDefault: true }],
    ["syncState", { source: "train2go", lastSyncAt: AT }],
    [
      "usage",
      {
        yearMonth: "2026-05",
        totalTokens: 120,
        totalCost: 0.2,
        entries: [{ date: DAY, tokens: 120, cost: 0.2 }],
      },
    ],
    ["bridges", { extensionId: "ext-1", status: "connected", lastSeen: 1 }],
    [
      "coachingActivities",
      {
        id: "p1:train2go:t2g-1",
        profileId: "p1",
        date: DAY,
        source: "train2go",
        sourceId: "t2g-1",
      },
    ],
    ["coachingSyncState", { source: "train2go", profileId: "p1" }],
    [
      "sessionMatches",
      {
        id: "sm1",
        profileId: "p1",
        coachingActivityId: "p1:train2go:t2g-2",
        workoutId: "w-other",
        date: DAY,
        source: "auto-conversion",
        createdAt: AT,
      },
    ],
    ["userPreferences", { profileId: "p1", calendarDensity: "compact" }],
    ["autoMatchDismissals", { profileId: "p1", weekStart: DAY }],
    health("healthSleep"),
    health("healthWeight"),
    health("healthHrv"),
    health("healthDaily"),
    health("healthBodyComposition"),
    health("healthStress"),
    [
      "integrationPolicies",
      {
        id: "ip1",
        profileId: "p1",
        dataType: version >= V_DATA_HUB ? "planned-session" : "training-plan",
        direction: "import",
        bridgeId: "train2go-bridge",
        mode: "auto",
        enabled: true,
        updatedAt: AT,
      },
    ],
    [
      "exportLedger",
      {
        id: "el1",
        kaiordRecordId: "w1",
        destinationBridgeId: "garmin-bridge",
        dataType: "workout",
        destinationExternalId: "pending",
        updatedAt: AT,
      },
    ],
    ["tombstones", { table: "workouts", id: "w-gone", deletedAt: AT }],
    [
      "coachingDayNotes",
      { id: `p1:train2go:${DAY}`, profileId: "p1", date: DAY, notes: [] },
    ],
    ["chatMessages", { id: "cm1", profileId: "p1", createdAt: AT, text: "hi" }],
    [
      "aiModelBindings",
      { profileId: "p1", purpose: "chat", providerId: "ai1", modelId: "m" },
    ],
    [
      "connections",
      { profileId: "p1", providerId: "garmin", status: "connected" },
    ],
    [
      "chatConversations",
      { id: "cc1", profileId: "p1", title: "Plans", updatedAt: AT },
    ],
    [
      "intakeEntries",
      { id: "ie1", profileId: "p1", date: DAY, loggedAt: AT, kcal: 500 },
    ],
    ["intakePresets", { id: "pr1", profileId: "p1", createdAt: AT }],
    ["energyTargets", { profileId: "p1", kcal: 2500, updatedAt: AT }],
    [
      "plannedSessions",
      {
        id: "p1:train2go:t2g-9",
        profileId: "p1",
        date: DAY,
        source: "train2go",
        sourceId: "t2g-9",
      },
    ],
    ["activities", { id: "a1", profileId: "p1", date: DAY }],
    [
      "dataTypeSourcePolicy",
      { profileId: "p1", dataType: "sleep", mode: "union" },
    ],
    ["labReports", { id: "lr1", profileId: "p1", date: DAY }],
    [
      "labValues",
      {
        id: "lv1",
        profileId: "p1",
        parameterKey: "ferritin",
        date: DAY,
        reportId: "lr1",
      },
    ],
    [
      "usageEvents",
      { id: "ue1", yearMonth: "2026-05", purpose: "workout_generation" },
    ],
    ["usageEvents", { id: "ue2", yearMonth: "2026-05", purpose: "chat" }],
    health("healthStrain"),
    health("healthVitals"),
    health("healthHeartRateSeries"),
  ];
};

/** Creates `name` exactly as release `version` left it, with seed rows. */
const createHistoricalDatabase = async (
  name: string,
  version: number
): Promise<Array<[string, Row]>> => {
  const old = new Dexie(name);
  registerFullHistory(old, version);
  await old.open();
  const tables = new Set(old.tables.map((t) => t.name));
  const rows = seedRows(version).filter(([table]) => tables.has(table));
  for (const [table, row] of rows) await old.table(table).add(row);
  old.close();
  return rows;
};

type IndexShape = [string, string, boolean, boolean];
type TableShape = { primKey: string; auto: boolean; indexes: IndexShape[] };

const keyPathOf = (kp: string | string[] | undefined | null): string =>
  Array.isArray(kp) ? `[${kp.join("+")}]` : (kp ?? "");

const shapeOf = (db: Dexie): Record<string, TableShape> =>
  Object.fromEntries(
    db.tables
      .filter((t) => !t.name.startsWith("$"))
      .map((t): [string, TableShape] => [
        t.name,
        {
          primKey: keyPathOf(t.schema.primKey.keyPath),
          auto: Boolean(t.schema.primKey.auto),
          indexes: t.schema.indexes
            .map((i): IndexShape => [
              i.name,
              keyPathOf(i.keyPath),
              Boolean(i.unique),
              Boolean(i.multi),
            ])
            .sort((a, b) => a[0].localeCompare(b[0])),
        },
      ])
      .sort(([a], [b]) => a.localeCompare(b))
  );

/** Stores and indexes as IndexedDB actually holds them for `name`. */
const installedShape = async (name: string) => {
  const raw = new Dexie(name);
  await raw.open();
  const shape = shapeOf(raw);
  const verno = raw.verno;
  raw.close();
  return { shape, verno };
};

/** Today's schema, parsed by Dexie from the frozen head declaration. */
const expectedShape = (): Record<string, TableShape> => {
  const declared = new Dexie("expected-shape-never-opened");
  declared
    .version(HISTORY_HEAD)
    .stores(cumulativeStores(historyRegistrations(), HISTORY_HEAD));
  return shapeOf(declared);
};

const dump = async (db: Dexie): Promise<Record<string, unknown[]>> => {
  const out: Record<string, unknown[]> = {};
  for (const table of db.tables) out[table.name] = await table.toArray();
  return out;
};

const keyOf = (db: Dexie, table: string, row: Row): unknown => {
  const kp = db.table(table).schema.primKey.keyPath;
  return Array.isArray(kp) ? kp.map((k) => row[k]) : row[kp as string];
};

/** Rows an upgrade removes on purpose, keyed by the version that removes them. */
const removedByDesign = (from: number, table: string, row: Row): boolean =>
  (table === "autoMatchDismissals" && from < V_DISMISSALS_CLEARED) ||
  (table === "usageEvents" &&
    row.purpose === "chat" &&
    from < V_USAGE_CUTOVER) ||
  (table === "usage" && from < V_USAGE_CUTOVER);

const uniqueName = (label: string): string =>
  `schema-history-${label}-${Date.now()}-${Math.random()}`;

let uuidCounter = 0;

const openDeterministically = async (db: Dexie): Promise<void> => {
  uuidCounter = 0;
  vi.setSystemTime(new Date(AT));
  await db.open();
};

describe("upgrading from every historical version with the pruned KaiordDatabase", () => {
  const upgrades: ReadonlyMap<number, Registration> =
    captureKaiordRegistrations();
  const names: string[] = [];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.spyOn(crypto, "randomUUID").mockImplementation(
      () =>
        `00000000-0000-4000-8000-${String(++uuidCounter).padStart(UUID_SUFFIX_DIGITS, "0")}`
    );
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await Promise.all(names.splice(0).map((n) => Dexie.delete(n)));
  });

  it("should create today's schema on a fresh install", async () => {
    // Arrange
    const name = uniqueName("fresh");
    names.push(name);
    const db = new KaiordDatabase(name);

    // Act
    await db.open();
    db.close();
    const installed = await installedShape(name);

    // Assert
    expect(installed.verno).toBe(HISTORY_HEAD);
    expect(installed.shape).toEqual(expectedShape());
  });

  it.each(HISTORY_VERSIONS)(
    "should upgrade a v%i database to today's schema with every row intact",
    async (from) => {
      // Arrange
      const prunedName = uniqueName(`v${from}-pruned`);
      const fullName = uniqueName(`v${from}-full`);
      names.push(prunedName, fullName);
      const seeded = await createHistoricalDatabase(prunedName, from);
      await createHistoricalDatabase(fullName, from);
      const pruned = new KaiordDatabase(prunedName);
      const full = new Dexie(fullName);
      registerFullHistory(full, HISTORY_HEAD, upgrades);

      // Act
      await openDeterministically(pruned);
      await openDeterministically(full);
      const prunedRows = await dump(pruned);
      const fullRows = await dump(full);
      const survivors = await Promise.all(
        seeded
          .filter(([table, row]) => !removedByDesign(from, table, row))
          .map(async ([table, row]) => ({
            table,
            found: await pruned.table(table).get(keyOf(pruned, table, row)),
          }))
      );
      const folded = await pruned
        .table("usageEvents")
        .get("usage-migrated:2026-05:0");
      pruned.close();
      full.close();
      const installed = await installedShape(prunedName);

      // Assert
      expect(installed.verno).toBe(HISTORY_HEAD);
      expect(installed.shape).toEqual(expectedShape());
      expect(prunedRows).toEqual(fullRows);
      expect(survivors.filter((s) => s.found === undefined)).toEqual([]);
      if (from < V_USAGE_CUTOVER)
        expect(folded).toMatchObject({ tokens: 120, cost: 0.2 });
      // coachingActivities exists from v4; v27 copies it into plannedSessions.
      if (from >= V_COACHING_TABLES && from < V_DATA_HUB) {
        expect(prunedRows.plannedSessions).toContainEqual(
          expect.objectContaining({ id: "p1:train2go:t2g-1" })
        );
      }
    },
    PER_VERSION_TIMEOUT_MS
  );
});
