/**
 * Provider / tokens / USD summary list used inside the batch cost
 * confirmation panel.
 */

import type { BatchCostEstimate } from "../../../hooks/use-batch-cost-estimate";
import { useTranslate } from "../../../i18n/use-translate";

export type BatchCostEstimateListProps = {
  estimate: BatchCostEstimate;
};

export function BatchCostEstimateList({
  estimate,
}: BatchCostEstimateListProps) {
  const t = useTranslate("coaching");
  return (
    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-gray-500 dark:text-gray-400">
        {t("batchCost.provider")}
      </dt>
      <dd
        data-testid="batch-cost-provider"
        className="font-medium text-gray-900 dark:text-gray-100"
      >
        {estimate.providerLabel ?? t("batchCost.noProvider")}
      </dd>
      <dt className="text-gray-500 dark:text-gray-400">
        {t("batchCost.tokens")}
      </dt>
      <dd
        data-testid="batch-cost-tokens"
        className="font-medium text-gray-900 dark:text-gray-100"
      >
        {estimate.tokens.toLocaleString()}
      </dd>
      <dt className="text-gray-500 dark:text-gray-400">
        {t("batchCost.cost")}
      </dt>
      <dd
        data-testid="batch-cost-usd"
        className="font-medium text-gray-900 dark:text-gray-100"
      >
        {estimate.costUsd !== null
          ? t("batchCost.costValue", { amount: estimate.costUsd.toFixed(4) })
          : "—"}
      </dd>
    </dl>
  );
}
