import type { CoachingStepGroup } from "../../../types/coaching-structured-steps";

/**
 * What the Train2Go Connector reads out of Train2Go's answers: one coaching
 * activity of the weekly or daily plan, and one comment of a day's thread.
 */

export type Train2GoActivity = {
  id: number;
  date: string;
  sport: string;
  title: string;
  duration: string;
  workload: number;
  status: number;
  description?: string;
  completion?: number;
  /** The activity's steps table, only when every cell of it was read. */
  steps?: CoachingStepGroup[];
};

export type Train2GoComment = {
  author: string;
  isOwn: boolean;
  timestamp: string;
  text: string;
};
