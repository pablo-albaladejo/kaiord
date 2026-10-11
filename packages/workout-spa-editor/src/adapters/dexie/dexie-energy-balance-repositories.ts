/**
 * Dexie implementations of the energy-balance repositories (v25 stores
 * `intakeEntries`, `intakePresets`, `energyTargets`), synced and per-profile,
 * so each exposes `deleteByProfile` for the profile-delete cascade.
 */
import type {
  EnergyBalanceRepositories,
  EnergyTargetRepository,
  IntakeEntryRepository,
  IntakePresetRepository,
} from "../../ports/energy-balance-repositories";
import type { EnergyTargetRecord } from "../../types/energy-target-record";
import type { IntakeEntryRecord } from "../../types/intake-entry-record";
import type { IntakePresetRecord } from "../../types/intake-preset-record";
import type { KaiordDatabase } from "./dexie-database";

// Every date of one profile on the `[profileId+date]` index.
const entriesOfProfile = (db: KaiordDatabase, profileId: string) =>
  db
    .table("intakeEntries")
    .where("[profileId+date]")
    .between([profileId, ""], [profileId, "\uffff"]);

const presetsOfProfile = (db: KaiordDatabase, profileId: string) =>
  db.table("intakePresets").where("profileId").equals(profileId);

const createIntakeEntryRepository = (
  db: KaiordDatabase
): IntakeEntryRepository => ({
  getById: async (id) =>
    (await db.table("intakeEntries").get(id)) as IntakeEntryRecord | undefined,

  getByProfileAndDate: async (profileId, date) =>
    (await db
      .table("intakeEntries")
      .where("[profileId+date]")
      .equals([profileId, date])
      .toArray()) as IntakeEntryRecord[],

  listByProfile: async (profileId) =>
    (await entriesOfProfile(db, profileId).toArray()) as IntakeEntryRecord[],

  put: async (record) => {
    await db.table("intakeEntries").put(record);
  },

  delete: async (id) => {
    await db.table("intakeEntries").delete(id);
  },

  deleteByProfile: async (profileId) => {
    await entriesOfProfile(db, profileId).delete();
  },
});

const createIntakePresetRepository = (
  db: KaiordDatabase
): IntakePresetRepository => ({
  getById: async (id) =>
    (await db.table("intakePresets").get(id)) as IntakePresetRecord | undefined,

  getByProfile: async (profileId) =>
    (await presetsOfProfile(db, profileId).toArray()) as IntakePresetRecord[],

  put: async (record) => {
    await db.table("intakePresets").put(record);
  },

  delete: async (id) => {
    await db.table("intakePresets").delete(id);
  },

  deleteByProfile: async (profileId) => {
    await presetsOfProfile(db, profileId).delete();
  },
});

const createEnergyTargetRepository = (
  db: KaiordDatabase
): EnergyTargetRepository => ({
  get: async (profileId) =>
    (await db.table("energyTargets").get(profileId)) as
      EnergyTargetRecord | undefined,

  put: async (record) => {
    await db.table("energyTargets").put(record);
  },

  deleteByProfile: async (profileId) => {
    await db.table("energyTargets").delete(profileId);
  },
});

export const createDexieEnergyBalanceRepositories = (
  db: KaiordDatabase
): EnergyBalanceRepositories => ({
  intakeEntries: createIntakeEntryRepository(db),
  intakePresets: createIntakePresetRepository(db),
  energyTargets: createEnergyTargetRepository(db),
});
