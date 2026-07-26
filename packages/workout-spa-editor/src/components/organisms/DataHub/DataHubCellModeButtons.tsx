/**
 * DataHubCellModeButtons — the Auto/Manual segmented control inside
 * DataHubCellMenu.
 */
import { useTranslate } from "../../../i18n/use-translate";
import type { IntegrationPolicyMode } from "../../../types/integration-policy";

type Props = {
  testId: string;
  mode: IntegrationPolicyMode;
  onSelect: (mode: IntegrationPolicyMode) => void;
};

const MODES: readonly IntegrationPolicyMode[] = ["auto", "manual"];
export const DataHubCellModeButtons: React.FC<Props> = ({
  testId,
  mode,
  onSelect,
}) => {
  const t = useTranslate("data-hub");
  return (
    <div className="mb-2 flex gap-1">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          data-testid={`${testId}-mode-${m}`}
          aria-pressed={mode === m}
          onClick={() => onSelect(m)}
          className={`flex-1 rounded px-1.5 py-1 ${
            mode === m
              ? "bg-primary-600 text-white"
              : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          {t(`mode.${m}`)}
        </button>
      ))}
    </div>
  );
};
