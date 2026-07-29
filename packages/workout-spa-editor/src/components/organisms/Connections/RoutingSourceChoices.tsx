import type { ManagedDataType } from "@kaiord/core";

import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { useTranslate } from "../../../i18n/use-translate";
import { choiceLabel } from "./routing-change-copy";

type Props = {
  dataType: ManagedDataType;
  options: SourceOfTruthOptions;
  onPick: (sourceId: string) => void;
  onKeepAll: () => void;
};

const BASE =
  "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors";
const ON = "border-transparent bg-accent/15 text-accent";
const OFF = "border-edge bg-surface text-ink-body";

type ChoiceProps = {
  testId: string;
  selected: boolean;
  label: string;
  onClick: () => void;
};

const Choice = ({ testId, selected, label, onClick }: ChoiceProps) => (
  <button
    type="button"
    aria-pressed={selected}
    data-testid={testId}
    onClick={onClick}
    className={`${BASE} ${selected ? ON : OFF}`}
  >
    {label}
  </button>
);

/**
 * "Keep every source" is listed first and always, so returning a type to the
 * default is exactly as reachable as leaving it — the reversal is not buried
 * behind the choice that caused it.
 */
export function RoutingSourceChoices({
  dataType,
  options,
  onPick,
  onKeepAll,
}: Props) {
  const t = useTranslate("connections");

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label={t("routing.change.title", {
        type: t(`dataTypes.${dataType}`),
      })}
    >
      <Choice
        testId={`routing-choice-${dataType}-union`}
        selected={options.mode !== "priority"}
        label={t("routing.change.keepAll")}
        onClick={onKeepAll}
      />
      {options.choices.map((sourceId) => (
        <Choice
          key={sourceId}
          testId={`routing-choice-${dataType}-${sourceId}`}
          selected={options.current === sourceId}
          label={choiceLabel(sourceId)}
          onClick={() => onPick(sourceId)}
        />
      ))}
    </div>
  );
}
