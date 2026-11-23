import type { ManagedDataType } from "@kaiord/core";

import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { useTranslate } from "../../../i18n/use-translate";
import { RoutingChoiceButton } from "../Connections/RoutingChoiceButton";
import { choiceLabel } from "./authority-copy";

type Props = {
  dataType: ManagedDataType;
  options: SourceOfTruthOptions;
  onPick: (sourceId: string) => void;
  onAutomatic: () => void;
};

/**
 * "Automatic" is listed first and always, so handing a kind back to the App
 * is exactly as reachable as choosing for it.
 */
export function AuthorityChoices({
  dataType,
  options,
  onPick,
  onAutomatic,
}: Props) {
  const t = useTranslate("settings");
  const tConnections = useTranslate("connections");

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label={t("authority.choose", {
        type: tConnections(`dataTypes.${dataType}`),
      })}
    >
      <RoutingChoiceButton
        testId={`authority-choice-${dataType}-automatic`}
        selected={options.mode === "automatic"}
        label={t("authority.automatic")}
        onClick={onAutomatic}
      />
      {options.choices.map((sourceId) => (
        <RoutingChoiceButton
          key={sourceId}
          testId={`authority-choice-${dataType}-${sourceId}`}
          selected={options.current === sourceId}
          label={choiceLabel(sourceId, tConnections)}
          onClick={() => onPick(sourceId)}
        />
      ))}
    </div>
  );
}
