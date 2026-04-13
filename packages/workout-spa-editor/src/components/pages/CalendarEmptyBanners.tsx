/**
 * CalendarEmptyBanners — Conditional empty state + processing banners.
 */

import type { BatchProgress } from "../../application/batch-processor";
import { BatchMessage } from "../molecules/BatchProcessingBanner/BatchMessage";
import { BatchProcessingBanner } from "../molecules/BatchProcessingBanner/BatchProcessingBanner";
import {
  EmptyWeekState,
  FirstVisitState,
  NoAiProviderState,
  NoBridgesState,
} from "../molecules/CalendarEmptyStates";

export type CalendarEmptyBannersProps = {
  hasAnyWorkouts: boolean;
  hasWeekWorkouts: boolean;
  hasReadyWorkouts: boolean;
  hasAiProvider: boolean;
  extensionInstalled: boolean;
  rawCount: number;
  onGoToLatest?: () => void;
  batchMessage: string | null;
  onDismissBatch: () => void;
  batchIsProcessing: boolean;
  batchProgress: BatchProgress | null;
  onBatchProcess: () => void;
  onBatchCancel: () => void;
};

export function CalendarEmptyBanners(p: CalendarEmptyBannersProps) {
  return (
    <>
      {!p.hasAnyWorkouts && <FirstVisitState />}
      {p.hasAnyWorkouts && !p.hasWeekWorkouts && (
        <EmptyWeekState onGoToLatest={p.onGoToLatest} />
      )}
      {p.rawCount > 0 && !p.hasAiProvider && <NoAiProviderState />}
      {p.hasReadyWorkouts && !p.extensionInstalled && <NoBridgesState />}
      {p.batchMessage && (
        <BatchMessage message={p.batchMessage} onDismiss={p.onDismissBatch} />
      )}
      <BatchProcessingBanner
        rawCount={p.rawCount}
        isProcessing={p.batchIsProcessing}
        progress={p.batchProgress}
        onProcess={p.onBatchProcess}
        onCancel={p.onBatchCancel}
      />
    </>
  );
}
