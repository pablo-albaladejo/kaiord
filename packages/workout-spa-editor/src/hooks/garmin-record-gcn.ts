/**
 * A persisted workout's GCN payload, with its pace zone targets resolved
 * from the zones of the profile that owns the workout. Every Garmin push
 * (single push, Send week, chat) builds its payload here.
 */
import { db } from "../adapters/dexie/dexie-database";
import { createDexieProfileRepository } from "../adapters/dexie/dexie-profile-repository";
import type { ProfileRepository } from "../ports/persistence-port";
import type { KRD } from "../types/krd";
import { exportGcnWorkout } from "../utils/export-workout-formats";

const profileRepo = createDexieProfileRepository(db);

export const exportRecordGcn = async (
  krd: KRD,
  profileId: string,
  profiles: ProfileRepository = profileRepo
): Promise<unknown> => exportGcnWorkout(krd, await profiles.getById(profileId));
