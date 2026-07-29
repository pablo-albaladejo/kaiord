import type { ManagedDataType } from "@kaiord/core";

import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { useTranslate } from "../../../i18n/use-translate";
import { choiceLabel } from "./routing-change-copy";
import { RoutingChoiceButton } from "./RoutingChoiceButton";

type Props = {
  dataType: ManagedDataType;
  options: SourceOfTruthOptions;
  onPick: (sourceId: string) => void;
  onKeepAll: () => void;
};

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
      <RoutingChoiceButton
        testId={`routing-choice-${dataType}-union`}
        selected={options.mode !== "priority"}
        label={t("routing.change.keepAll")}
        onClick={onKeepAll}
      />
      {options.choices.map((sourceId) => (
        <RoutingChoiceButton
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
