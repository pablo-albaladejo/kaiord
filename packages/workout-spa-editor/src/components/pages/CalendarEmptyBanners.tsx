/**
 * The week's status banners, in one place, with a cap of one action.
 *
 * Two rules govern what renders:
 *
 * 1. **A profile with no workouts at all gets the first-run guide and nothing
 *    else.** Every branch below it is gated on data existing, so before this
 *    the emptiest possible state rendered nothing at all — the bug. The guide
 *    already names all three dependencies, so repeating them underneath would
 *    say the same thing four times.
 * 2. **The raw sessions get exactly one banner.** With a provider configured
 *    that is the batch action; without one it is the banner that names what
 *    the raw sessions cannot do. They are two readings of the same fact, and
 *    only one of them can be acted on.
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

export type CalendarEmptyBannersProps = {
  /** Rendered week's id, threaded to EmptyWeekState's back-origin. */
  weekId: string;
  hasAnyWorkouts: boolean;
  hasWeekWorkouts: boolean;
  readyCount: number;
  hasAiProvider: boolean;
  extensionInstalled: boolean;
  rawCount: number;
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

export function CalendarEmptyBanners(p: CalendarEmptyBannersProps) {
  if (!p.hasAnyWorkouts) return <FirstRunGuide weekId={p.weekId} />;

  const rawNeedsKey = p.rawCount > 0 && !p.hasAiProvider;
  return (
    <>
      {!p.hasWeekWorkouts && (
        <EmptyWeekState
          weekId={p.weekId}
          latestDate={p.latestDate}
          onGoToLatest={p.onGoToLatest}
        />
      )}
      {rawNeedsKey && <NoAiProviderState rawCount={p.rawCount} />}
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
