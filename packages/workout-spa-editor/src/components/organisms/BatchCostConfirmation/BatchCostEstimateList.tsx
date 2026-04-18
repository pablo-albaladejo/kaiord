/**
 * Provider / tokens / USD summary list used inside the batch cost
 * confirmation panel.
 */

import type { BatchCostEstimate } from "../../../hooks/use-batch-cost-estimate";

export type BatchCostEstimateListProps = {
  estimate: BatchCostEstimate;
};

export function BatchCostEstimateList({
  estimate,
}: BatchCostEstimateListProps) {
  return (
    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-gray-500 dark:text-gray-400">Provider</dt>
      <dd
        data-testid="batch-cost-provider"
        className="font-medium text-gray-900 dark:text-gray-100"
      >
        {estimate.providerLabel ?? "No provider selected"}
      </dd>
      <dt className="text-gray-500 dark:text-gray-400">Estimated tokens</dt>
      <dd
        data-testid="batch-cost-tokens"
        className="font-medium text-gray-900 dark:text-gray-100"
      >
        {estimate.tokens.toLocaleString()}
      </dd>
      <dt className="text-gray-500 dark:text-gray-400">Estimated cost</dt>
      <dd
        data-testid="batch-cost-usd"
        className="font-medium text-gray-900 dark:text-gray-100"
      >
        {estimate.costUsd !== null
          ? `$${estimate.costUsd.toFixed(4)} USD`
          : "—"}
      </dd>
    </dl>
  );
}
