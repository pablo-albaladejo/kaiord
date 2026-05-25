import type {
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthWeightRecord,
} from "../../../../types/health/health-records";

const MS_PER_SECOND = 1000;

export type TrendPoint = { x: number; y: number };

const toSeconds = (isoDate: string): number =>
  Math.floor(new Date(`${isoDate}T00:00:00Z`).getTime() / MS_PER_SECOND);

const sortByDate = (points: TrendPoint[]): TrendPoint[] =>
  [...points].sort((a, b) => a.x - b.x);

export const sleepSeries = (records: HealthSleepRecord[]): TrendPoint[] =>
  sortByDate(
    records
      .filter((r) => r.krd.score !== undefined)
      .map((r) => ({ x: toSeconds(r.date), y: r.krd.score as number }))
  );

export const hrvSeries = (records: HealthHrvRecord[]): TrendPoint[] =>
  sortByDate(records.map((r) => ({ x: toSeconds(r.date), y: r.krd.rMSSD })));

export const weightSeries = (records: HealthWeightRecord[]): TrendPoint[] =>
  sortByDate(
    records.map((r) => ({ x: toSeconds(r.date), y: r.krd.weightKilograms }))
  );

export const stepsSeries = (records: HealthDailyRecord[]): TrendPoint[] =>
  sortByDate(
    records
      .filter((r) => Number.isFinite(r.krd.steps))
      .map((r) => ({ x: toSeconds(r.date), y: r.krd.steps }))
  );

export const toAlignedData = (points: TrendPoint[]): [number[], number[]] => [
  points.map((p) => p.x),
  points.map((p) => p.y),
];
