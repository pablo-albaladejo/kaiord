import type { SourcePolicyRow } from "../../../application/data-hub/source-policy-rows";
import { useTranslate } from "../../../i18n/use-translate";
import { INTEGRATION_REGISTRY } from "../../../integrations/integration-registry";
import { Icon, ICON_MAP } from "../../atoms/Icon";

const bridgeName = (bridgeId: string): string =>
  INTEGRATION_REGISTRY.find((entry) => entry.bridgeId === bridgeId)?.name ??
  bridgeId;

type Props = {
  row: SourcePolicyRow;
  onMove: (row: SourcePolicyRow, bridgeId: string, delta: number) => void;
};

export const SourceOrderList: React.FC<Props> = ({ row, onMove }) => {
  const t = useTranslate("data-hub");
  return (
    <ol className="mt-2 space-y-1" data-testid={`source-order-${row.dataType}`}>
      {row.sourceOrder.map((bridgeId, index) => (
        <li
          key={bridgeId}
          className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-sm dark:bg-gray-800/60"
        >
          <span>
            <span className="mr-2 text-gray-400">{index + 1}</span>
            {bridgeName(bridgeId)}
          </span>
          <span className="flex gap-1">
            <button
              type="button"
              aria-label={t("moveUp", { name: bridgeName(bridgeId) })}
              disabled={index === 0}
              data-testid={`source-up-${row.dataType}-${bridgeId}`}
              onClick={() => {
                void onMove(row, bridgeId, -1);
              }}
              className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
            >
              <Icon icon={ICON_MAP.arrowUp} size="xs" color="inherit" />
            </button>
            <button
              type="button"
              aria-label={t("moveDown", { name: bridgeName(bridgeId) })}
              disabled={index === row.sourceOrder.length - 1}
              data-testid={`source-down-${row.dataType}-${bridgeId}`}
              onClick={() => {
                void onMove(row, bridgeId, 1);
              }}
              className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-gray-700"
            >
              <Icon icon={ICON_MAP.arrowDown} size="xs" color="inherit" />
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
};
