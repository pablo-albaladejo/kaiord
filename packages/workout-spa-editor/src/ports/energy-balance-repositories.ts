/**
 * Energy-balance persistence ports (energy-balance-tracking, Phase 0).
 *
 * Nutrition intake entries, reusable intake presets, and the single active
 * deficit/surplus goal per profile. All three ride the cloud snapshot; an
 * entry or preset delete is tombstoned through `getById` + `delete` (see
 * `adapters/with-tombstones`). Each repository exposes a `deleteByProfile` so
 * the profile-delete cascade can clear it (all three are per-profile tables).
 */

import type { EnergyTargetRecord } from "../types/energy-target-record";
import type { IntakeEntryRecord } from "../types/intake-entry-record";
import type { IntakePresetRecord } from "../types/intake-preset-record";

export type IntakeEntryRepository = {
  getById: (id: string) => Promise<IntakeEntryRecord | undefined>;
  getByProfileAndDate: (
    profileId: string,
    date: string
  ) => Promise<IntakeEntryRecord[]>;
  /** Every entry of the profile, all dates (the backup export). */
  listByProfile: (profileId: string) => Promise<IntakeEntryRecord[]>;
  put: (record: IntakeEntryRecord) => Promise<void>;
  delete: (id: string) => Promise<void>;
  /** Profile-delete cascade: remove every intake entry for the profile. */
  deleteByProfile: (profileId: string) => Promise<void>;
};

export type IntakePresetRepository = {
  getById: (id: string) => Promise<IntakePresetRecord | undefined>;
  getByProfile: (profileId: string) => Promise<IntakePresetRecord[]>;
  put: (record: IntakePresetRecord) => Promise<void>;
  delete: (id: string) => Promise<void>;
  /** Profile-delete cascade: remove every preset for the profile. */
  deleteByProfile: (profileId: string) => Promise<void>;
};

export type EnergyTargetRepository = {
  get: (profileId: string) => Promise<EnergyTargetRecord | undefined>;
  put: (record: EnergyTargetRecord) => Promise<void>;
  /** Profile-delete cascade: remove the goal for the profile. */
  deleteByProfile: (profileId: string) => Promise<void>;
};

export type EnergyBalanceRepositories = {
  intakeEntries: IntakeEntryRepository;
  intakePresets: IntakePresetRepository;
  energyTargets: EnergyTargetRepository;
};
