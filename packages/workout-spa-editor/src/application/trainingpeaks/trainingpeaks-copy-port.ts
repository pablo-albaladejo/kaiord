/**
 * Port — reads one workout copy Kaiord created on TrainingPeaks, by the id
 * the record holds. The adapter never throws: TrainingPeaks' own "not
 * found" is `absent`, any other failure `unknown`.
 */
import type { LiveState } from "../safe-writes/live-state";

export type TrainingPeaksCopyPort = {
  read: (workoutId: string) => Promise<LiveState>;
};
