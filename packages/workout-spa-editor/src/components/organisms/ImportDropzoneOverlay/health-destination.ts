/**
 * Maps a health KRD type to the Health Hub URL the import flow
 * should redirect to after a successful save.
 */
import type { FileType } from "@kaiord/core";

const HEALTH_DESTINATIONS: Partial<Record<FileType, string>> = {
  sleep_record: "/health/sleep",
  weight_measurement: "/health/weight",
  body_composition: "/health/weight",
  hrv_summary: "/health/recovery",
  stress_episode: "/health/recovery",
  daily_wellness: "/health/activity",
};

export const healthDestinationFor = (type: FileType): string =>
  HEALTH_DESTINATIONS[type] ?? "/health";
