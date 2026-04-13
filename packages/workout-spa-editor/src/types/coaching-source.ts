/**
 * CoachingSource — Port interface for external coaching platforms.
 *
 * Each platform (Train2Go, TrainingPeaks, etc.) implements this port.
 * Calendar hooks and components consume only this interface — never
 * platform-specific stores, mappers, or types.
 */

import type { CoachingActivity } from "./coaching-activity";

export type CoachingSource = {
  id: string;
  label: string;
  badge: string;
  available: boolean;
  connected: boolean;
  loading: boolean;
  error: string | null;
  activities: CoachingActivity[];
  sync: (weekStart: string) => void;
  expand: (date: string) => void;
  connect: () => void;
};
