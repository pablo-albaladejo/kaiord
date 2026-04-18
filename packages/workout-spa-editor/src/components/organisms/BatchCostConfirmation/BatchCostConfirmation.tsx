/**
 * BatchCostConfirmation — dialog shown before dispatching a batch
 * AI run. Renders provider, estimated tokens, estimated USD cost, and
 * an explicit "estimate, not a bill" disclaimer. Confirm → dispatch;
 * Cancel → abort without any UsageRecord write.
 *
 * Presentation-only: parent owns batch state and actual dispatch.
 */

import * as Dialog from "@radix-ui/react-dialog";

import { useBatchCostEstimate } from "../../../hooks/use-batch-cost-estimate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { BatchCostConfirmationPanel } from "./BatchCostConfirmationPanel";

export type BatchCostConfirmationProps = {
  open: boolean;
  workouts: WorkoutRecord[];
  provider: LlmProviderConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function BatchCostConfirmation({
  open,
  workouts,
  provider,
  onConfirm,
  onCancel,
}: BatchCostConfirmationProps) {
  const estimate = useBatchCostEstimate(workouts, provider);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-testid="batch-cost-backdrop"
          className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-0 shadow-xl dark:bg-gray-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg">
          <BatchCostConfirmationPanel
            workoutCount={workouts.length}
            estimate={estimate}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
