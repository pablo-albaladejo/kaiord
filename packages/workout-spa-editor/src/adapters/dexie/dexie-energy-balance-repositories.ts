/**
 * Dexie implementations of the energy-balance repositories (v25 stores
 * `intakeEntries`, `intakePresets`, `energyTargets`). All three are
 * device-local PII (excluded from the cloud snapshot) and per-profile, so
 * each exposes `deleteByProfile` for the profile-delete cascade.
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

const createIntakeEntryRepository = (
  db: KaiordDatabase
): IntakeEntryRepository => ({
  getByProfileAndDate: async (profileId, date) =>
    (await db
      .table("intakeEntries")
      .where("[profileId+date]")
      .equals([profileId, date])
      .toArray()) as IntakeEntryRecord[],

  put: async (record) => {
    await db.table("intakeEntries").put(record);
  },

  delete: async (id) => {
    await db.table("intakeEntries").delete(id);
  },

  deleteByProfile: async (profileId) => {
    await db
      .table("intakeEntries")
      .where("[profileId+date]")
      .between([profileId, ""], [profileId, "￿"])
      .delete();
  },
});

const createIntakePresetRepository = (
  db: KaiordDatabase
): IntakePresetRepository => ({
  getByProfile: async (profileId) =>
    (await db
      .table("intakePresets")
      .where("profileId")
      .equals(profileId)
      .toArray()) as IntakePresetRecord[],

  put: async (record) => {
    await db.table("intakePresets").put(record);
  },

  delete: async (id) => {
    await db.table("intakePresets").delete(id);
  },

  deleteByProfile: async (profileId) => {
    await db
      .table("intakePresets")
      .where("profileId")
      .equals(profileId)
      .delete();
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
