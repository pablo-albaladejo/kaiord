/**
 * In-memory energy-balance repositories for app-layer tests. Mirror the Dexie
 * adapters' contract so the two stay observationally equivalent. Self-contained
 * (no shared snapshot store) like the connection repository.
 */
import type {
  EnergyBalanceRepositories,
  EnergyTargetRepository,
  IntakeEntryRepository,
  IntakePresetRepository,
} from "../ports/energy-balance-repositories";
import type { EnergyTargetRecord } from "../types/energy-target-record";
import type { IntakeEntryRecord } from "../types/intake-entry-record";
import type { IntakePresetRecord } from "../types/intake-preset-record";

const createIntakeEntryRepository = (
  store: Map<string, IntakeEntryRecord>
): IntakeEntryRepository => ({
  getByProfileAndDate: async (profileId, date) =>
    [...store.values()].filter(
      (r) => r.profileId === profileId && r.date === date
    ),
  put: async (record) => {
    store.set(record.id, record);
  },
  delete: async (id) => {
    store.delete(id);
  },
  deleteByProfile: async (profileId) => {
    for (const [id, r] of store)
      if (r.profileId === profileId) store.delete(id);
  },
});

const createIntakePresetRepository = (
  store: Map<string, IntakePresetRecord>
): IntakePresetRepository => ({
  getByProfile: async (profileId) =>
    [...store.values()].filter((r) => r.profileId === profileId),
  put: async (record) => {
    store.set(record.id, record);
  },
  delete: async (id) => {
    store.delete(id);
  },
  deleteByProfile: async (profileId) => {
    for (const [id, r] of store)
      if (r.profileId === profileId) store.delete(id);
  },
});

const createEnergyTargetRepository = (
  store: Map<string, EnergyTargetRecord>
): EnergyTargetRepository => ({
  get: async (profileId) => store.get(profileId),
  put: async (record) => {
    store.set(record.profileId, record);
  },
  deleteByProfile: async (profileId) => {
    store.delete(profileId);
  },
});

export const createInMemoryEnergyBalanceRepositories =
  (): EnergyBalanceRepositories => ({
    intakeEntries: createIntakeEntryRepository(new Map()),
    intakePresets: createIntakePresetRepository(new Map()),
    energyTargets: createEnergyTargetRepository(new Map()),
  });
