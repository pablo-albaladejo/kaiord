/**
 * Contract test for `getLatestValues` with ABSOLUTE expected values, run
 * against BOTH the Dexie repo (fake-indexeddb) and the in-memory twin. It pins
 * the two behaviours the latest-per-parameter query must guarantee:
 *
 *   (a) DoD-4 — a parameter measured only in an OLDER report still surfaces
 *       (the query is latest-per-parameter, NOT latest-report).
 *   (b) same-day tie — two reports on the same date resolve deterministically
 *       by PK `id` order (stable, NOT temporal). Ids are injected sequentially
 *       so the expectation is reproducible.
 *
 * The two arms MUST return byte-identical results. The in-memory arm uses a
 * `transaction(fn) => fn()` stub (rollback is not exercised here).
 */
import "fake-indexeddb/auto";

import type { LabReport, LabValue } from "@kaiord/core";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { createInMemoryLabRepository } from "../../test-utils/in-memory-lab-repository";
import type { LabPersistence } from "./lab-persistence";
import { getLatestValues } from "./lab-queries";
import { saveLabReport } from "./save-lab-report.use-case";

const PROFILE = "p1";

// Absolute canonical values pinned by the contract (named to satisfy the
// no-magic-numbers rule and to document each parameter's expected latest).
const GLUCOSE_OLD = 90;
const GLUCOSE_NEW = 110;
const LDL_OLD = 100;
const HDL_EARLIER_ID = 50;
const HDL_LATER_ID = 55;

const rep = (id: string, date: string): LabReport => ({
  id,
  profileId: PROFILE,
  date,
  provenance: { source: "manual" },
});

const val = (
  id: string,
  reportId: string,
  parameterKey: string,
  date: string,
  valueCanonical: number
): LabValue => ({
  id,
  profileId: PROFILE,
  reportId,
  parameterKey,
  date,
  valueRaw: valueCanonical,
  unitRaw: "u",
  valueCanonical,
  unitCanonical: "u",
  refSource: "none",
  flag: "unknown",
  provenance: { source: "manual" },
});

const seedScenario = async (persistence: LabPersistence): Promise<void> => {
  // Old report: glucose + ldl. New report: glucose only (ldl not re-measured).
  await saveLabReport(persistence, rep("r-old", "2026-01-01"), [
    val("v-01", "r-old", "glucose", "2026-01-01", GLUCOSE_OLD),
    val("v-02", "r-old", "ldl", "2026-01-01", LDL_OLD),
  ]);
  await saveLabReport(persistence, rep("r-new", "2026-06-01"), [
    val("v-03", "r-new", "glucose", "2026-06-01", GLUCOSE_NEW),
  ]);
  // Two reports on the SAME date, both measuring hdl: greater id wins.
  await saveLabReport(persistence, rep("r-a", "2026-03-01"), [
    val("v-04", "r-a", "hdl", "2026-03-01", HDL_EARLIER_ID),
  ]);
  await saveLabReport(persistence, rep("r-b", "2026-03-01"), [
    val("v-05", "r-b", "hdl", "2026-03-01", HDL_LATER_ID),
  ]);
};

const runInline = <T>(fn: () => Promise<T>): Promise<T> => fn();

type Arm = {
  name: string;
  create: () => Promise<{
    persistence: LabPersistence;
    cleanup: () => Promise<void>;
  }>;
};

const arms: Arm[] = [
  {
    name: "dexie-lab",
    create: async () => {
      const name = `kaiord-test-latest-${Date.now()}-${Math.random()}`;
      const db = new KaiordDatabase(name);
      await db.open();
      return {
        persistence: createDexiePersistence(db),
        cleanup: async () => {
          db.close();
          await Dexie.delete(name);
        },
      };
    },
  },
  {
    name: "in-memory-lab",
    create: async () => ({
      persistence: {
        labs: createInMemoryLabRepository(),
        transaction: runInline,
      },
      cleanup: async () => undefined,
    }),
  },
];

describe.each(arms)("getLatestValues contract [$name]", ({ create }) => {
  let persistence: LabPersistence;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const arm = await create();
    persistence = arm.persistence;
    cleanup = arm.cleanup;
    await seedScenario(persistence);
  });

  afterEach(async () => {
    await cleanup();
  });

  it("should keep a parameter measured only in an older report", async () => {
    // Arrange

    // Act
    const latest = await getLatestValues(persistence.labs, PROFILE);
    const byKey = Object.fromEntries(
      latest.map((v) => [v.parameterKey, v.valueCanonical])
    );

    // Assert
    expect(byKey.ldl).toBe(LDL_OLD);
    expect(byKey.glucose).toBe(GLUCOSE_NEW);
  });

  it("should resolve a same-day tie by the greater PK id", async () => {
    // Arrange

    // Act
    const latest = await getLatestValues(persistence.labs, PROFILE);
    const hdl = latest.find((v) => v.parameterKey === "hdl");

    // Assert
    expect(hdl?.id).toBe("v-05");
    expect(hdl?.valueCanonical).toBe(HDL_LATER_ID);
  });

  it("should return the full latest-per-parameter set with absolute values", async () => {
    // Arrange

    // Act
    const latest = await getLatestValues(persistence.labs, PROFILE);

    // Assert
    expect(latest.map((v) => [v.parameterKey, v.id, v.valueCanonical])).toEqual(
      [
        ["glucose", "v-03", GLUCOSE_NEW],
        ["hdl", "v-05", HDL_LATER_ID],
        ["ldl", "v-02", LDL_OLD],
      ]
    );
  });
});
