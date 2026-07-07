// Identity projections for managed-data payloads. Each projects a payload
// to the canonical fields that determine its natural identity, used to
// derive dedup hashes. Kept out of the registry so that file stays under
// the per-file line cap.

import type { HashProjection } from "./managed-data-type";

export const weightHashProjection: HashProjection<unknown> = (p) => {
  const payload = p as { weightKilograms?: unknown; measuredAt?: unknown };
  return { kg: payload.weightKilograms, measuredAt: payload.measuredAt };
};

export const sleepHashProjection: HashProjection<unknown> = (p) => {
  const payload = p as { totalDurationSeconds?: unknown; startTime?: unknown };
  return {
    totalMinutes: payload.totalDurationSeconds,
    startedAt: payload.startTime,
  };
};

export const hrvHashProjection: HashProjection<unknown> = (p) => {
  const payload = p as { rMSSD?: unknown; measuredAt?: unknown };
  return { rMSSD: payload.rMSSD, measuredAt: payload.measuredAt };
};

export const dailyWellnessHashProjection: HashProjection<unknown> = (p) => {
  const payload = p as { steps?: unknown; date?: unknown };
  return { steps: payload.steps, date: payload.date };
};

export const bodyCompositionHashProjection: HashProjection<unknown> = (p) => {
  const payload = p as { bodyFatPercent?: unknown; measuredAt?: unknown };
  return {
    bodyFatPercent: payload.bodyFatPercent,
    measuredAt: payload.measuredAt,
  };
};

export const plannedSessionHashProjection: HashProjection<unknown> = (p) => {
  const payload = p as {
    source?: unknown;
    source_id?: unknown;
    date?: unknown;
  };
  return {
    source: payload.source,
    sourceId: payload.source_id,
    date: payload.date,
  };
};

export const activityHashProjection: HashProjection<unknown> = (p) => {
  const summary = (p as { summary?: Record<string, unknown> }).summary ?? {};
  return {
    source: summary.source,
    sourceId: summary.source_id,
    startTime: summary.start_time,
  };
};
