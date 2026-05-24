/**
 * Dispatch table for `importHealthFitFile` — one entry per health
 * metric, exposing the right repo + date extraction rule. Lives in
 * its own file so the use-case stays small.
 */
import type {
  BodyComposition,
  DailyWellness,
  HealthFileType,
  HrvSummary,
  SleepRecord,
  StressEpisode,
  WeightMeasurement,
} from "@kaiord/core";

import type { HealthRecordRepository } from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";
import { MissingHealthPayloadError } from "./import-health-errors";

export type HealthExtensions = {
  sleep?: SleepRecord;
  weight?: WeightMeasurement;
  hrv?: HrvSummary;
  daily?: DailyWellness;
  bodyComposition?: BodyComposition;
  stress?: StressEpisode;
};

type RowBase = { id: string; profileId: string };

const datePart = (iso: string): string => iso.slice(0, 10);

type Handler = (
  p: PersistencePort,
  health: HealthExtensions,
  base: RowBase
) => Promise<void> | undefined;

const put = <T>(
  repo: HealthRecordRepository<RowBase & { date: string; krd: T }>,
  base: RowBase,
  payload: T | undefined,
  toDate: (p: T) => string
): Promise<void> | undefined =>
  payload && repo.put({ ...base, date: toDate(payload), krd: payload });

const HANDLERS: Record<HealthFileType, Handler> = {
  sleep_record: (p, h, b) =>
    put(p.healthSleep, b, h.sleep, (s) => datePart(s.startTime)),
  weight_measurement: (p, h, b) =>
    put(p.healthWeight, b, h.weight, (w) => datePart(w.measuredAt)),
  hrv_summary: (p, h, b) =>
    put(p.healthHrv, b, h.hrv, (x) => datePart(x.measuredAt)),
  daily_wellness: (p, h, b) => put(p.healthDaily, b, h.daily, (d) => d.date),
  body_composition: (p, h, b) =>
    put(p.healthBodyComposition, b, h.bodyComposition, (c) =>
      datePart(c.measuredAt)
    ),
  stress_episode: (p, h, b) =>
    put(p.healthStress, b, h.stress, (s) => datePart(s.startTime)),
};

export const persistHealthByType = async (
  p: PersistencePort,
  type: HealthFileType,
  health: HealthExtensions,
  base: RowBase
): Promise<void> => {
  const result = HANDLERS[type](p, health, base);
  if (!result) throw new MissingHealthPayloadError(type);
  await result;
};
