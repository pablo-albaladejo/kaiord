/**
 * The week's status banners, in one place, with a cap of one action.
 *
 * Two rules govern what renders:
 *
 * 1. **A profile with no workouts and no coaching plans at all gets the
 *    first-run guide and nothing else.** A coach's plans in any week mean the
 *    user is past the first run, and the guide would contradict them.
 *    The guide already names all three dependencies (ticking the ones already
 *    true), so repeating them underneath would say the same thing four times.
 * 2. **The raw sessions get exactly one banner.** The coach's unstructured
 *    plans count as raw here: without a key they are stuck as prose too. With
 *    a provider configured that is the batch action; without one it is the
 *    banner that names what the raw sessions cannot do. They are two readings
 *    of the same fact, and only one of them can be acted on.
 */

import type { BatchProgress } from "../../application/batch-processor";
import { BatchMessage } from "../molecules/BatchProcessingBanner/BatchMessage";
import { BatchProcessingBanner } from "../molecules/BatchProcessingBanner/BatchProcessingBanner";
import {
  EmptyWeekState,
  FirstRunGuide,
  NoAiProviderState,
  NoBridgesState,
} from "../molecules/CalendarEmptyStates";
import type { FirstRunProgress } from "../molecules/CalendarEmptyStates/first-run-steps";

export type CalendarEmptyBannersProps = {
  /** Rendered week's id, threaded to EmptyWeekState's back-origin. */
  weekId: string;
  hasAnyWorkouts: boolean;
  hasWeekWorkouts: boolean;
  readyCount: number;
  hasAiProvider: boolean;
  extensionInstalled: boolean;
  rawCount: number;
  /** The week's coaching plans no workout answers yet (unstructured prose). */
  planCount?: number;
  /** The active profile has linked any account. */
  sourceLinked?: boolean;
  /** The profile holds a coaching plan in any week; undefined while loading. */
  hasAnyPlans: boolean | undefined;
  /** Formatted date of the latest session anywhere, when there is one. */
  latestDate?: string;
  onGoToLatest?: () => void;
  batchMessage: string | null;
  onDismissBatch: () => void;
  batchIsProcessing: boolean;
  batchProgress: BatchProgress | null;
  onBatchProcess: () => void;
  onBatchCancel: () => void;
};

const progress = (p: CalendarEmptyBannersProps): FirstRunProgress => ({
  sources: p.sourceLinked === true,
  aiKey: p.hasAiProvider,
  bridge: p.extensionInstalled,
});

export function CalendarEmptyBanners(p: CalendarEmptyBannersProps) {
  const planCount = p.planCount ?? 0;
  if (!p.hasAnyWorkouts) {
    // Wait for the plans query rather than flash the guide at a coached user.
    if (p.hasAnyPlans === undefined) return null;
    if (!p.hasAnyPlans) {
      return <FirstRunGuide weekId={p.weekId} done={progress(p)} />;
    }
  }

  const proseCount = p.rawCount + planCount;
  const rawNeedsKey = proseCount > 0 && !p.hasAiProvider;
  return (
    <>
      {!p.hasWeekWorkouts && planCount === 0 && (
        <EmptyWeekState
          weekId={p.weekId}
          latestDate={p.latestDate}
          onGoToLatest={p.onGoToLatest}
        />
      )}
      {rawNeedsKey && <NoAiProviderState rawCount={proseCount} />}
      {p.readyCount > 0 && !p.extensionInstalled && (
        <NoBridgesState readyCount={p.readyCount} />
      )}
      {p.batchMessage && (
        <BatchMessage message={p.batchMessage} onDismiss={p.onDismissBatch} />
      )}
      {!rawNeedsKey && (
        <BatchProcessingBanner
          rawCount={p.rawCount}
          isProcessing={p.batchIsProcessing}
          progress={p.batchProgress}
          onProcess={p.onBatchProcess}
          onCancel={p.onBatchCancel}
        />
      )}
    </>
  );
}
