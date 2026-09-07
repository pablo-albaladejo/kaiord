/**
 * Pure coaching-activity summarizer for the chat read tool.
 *
 * Coach-authored free text (`title`, `description`) is fenced as untrusted
 * data so a prompt injection synced from the coaching platform cannot steer
 * the assistant. `status` and `completionPercent` carry the
 * planned-vs-done / compliance signal. The row list is capped.
 */
import { fenceUntrusted } from "@kaiord/ai/prompts";

import type { CoachingActivityRecord } from "../../../types/coaching-activity-record";

const ROW_BUDGET = 60;

export type CoachingSummaryRow = {
  date: string;
  sport: string;
  status: string;
  completionPercent: number | null;
  /** Fenced untrusted text. */
  title: string;
  /** Fenced untrusted text, or null when the activity carries no description. */
  description: string | null;
};

export type CoachingSummary = {
  count: number;
  activities: CoachingSummaryRow[];
};

export const summarizeCoaching = (
  records: CoachingActivityRecord[]
): CoachingSummary => {
  const byDateAsc = [...records].sort((a, b) => a.date.localeCompare(b.date));
  return {
    count: records.length,
    activities: byDateAsc.slice(-ROW_BUDGET).map((a) => ({
      date: a.date,
      sport: a.sport,
      status: a.status,
      completionPercent: a.completionPercent ?? null,
      title: fenceUntrusted(a.title),
      description: a.description == null ? null : fenceUntrusted(a.description),
    })),
  };
};
