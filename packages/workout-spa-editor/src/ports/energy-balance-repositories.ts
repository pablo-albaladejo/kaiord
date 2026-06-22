/**
 * Energy-balance persistence ports (energy-balance-tracking, Phase 0).
 *
 * Device-local, snapshot-excluded stores: nutrition intake entries, reusable
 * intake presets, and the single active deficit/surplus goal per profile.
 * Each repository exposes a `deleteByProfile` so the profile-delete cascade
 * can clear it (all three are per-profile tables).
 */

import type { EnergyTargetRecord } from "../types/energy-target-record";
import type { IntakeEntryRecord } from "../types/intake-entry-record";
import type { IntakePresetRecord } from "../types/intake-preset-record";

export type IntakeEntryRepository = {
  getByProfileAndDate: (
    profileId: string,
    date: string
  ) => Promise<IntakeEntryRecord[]>;
  put: (record: IntakeEntryRecord) => Promise<void>;
  delete: (id: string) => Promise<void>;
  /** Profile-delete cascade: remove every intake entry for the profile. */
  deleteByProfile: (profileId: string) => Promise<void>;
};

export type IntakePresetRepository = {
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
