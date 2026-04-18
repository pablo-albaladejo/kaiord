/**
 * Panel body for BatchCostConfirmation — inner content of the Radix
 * Dialog. Separated to keep the Dialog wrapper thin.
 */

import * as Dialog from "@radix-ui/react-dialog";

import type { BatchCostEstimate } from "../../../hooks/use-batch-cost-estimate";
import { BatchCostEstimateList } from "./BatchCostEstimateList";

export type BatchCostConfirmationPanelProps = {
  workoutCount: number;
  estimate: BatchCostEstimate;
  onConfirm: () => void;
  onCancel: () => void;
};

export function BatchCostConfirmationPanel({
  workoutCount,
  estimate,
  onConfirm,
  onCancel,
}: BatchCostConfirmationPanelProps) {
  return (
    <div className="p-6">
      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Process {workoutCount} workout{workoutCount !== 1 ? "s" : ""} with AI?
      </Dialog.Title>
      <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Review the estimate before dispatching the batch.
      </Dialog.Description>
      <BatchCostEstimateList estimate={estimate} />
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        This is an estimate — actual usage may differ. Real cost is recorded per
        run in Settings → Usage.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          data-testid="batch-cost-cancel"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          data-testid="batch-cost-confirm"
          disabled={estimate.providerLabel === null}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
