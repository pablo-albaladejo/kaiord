import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeRouteToggle } from "../../../application/connections/data-type-route-toggles";
import { useTranslate } from "../../../i18n/use-translate";
import { sourceName } from "./routing-copy";
import { RoutingChoiceButton } from "./RoutingChoiceButton";

type Props = {
  dataType: ManagedDataType;
  toggles: readonly DataTypeRouteToggle[];
  onToggle: (bridgeId: string, enabled: boolean) => void;
};

/**
 * Switching a source on or off for one data type — the decision that precedes
 * ranking, and the only one that can make a type have a source at all.
 *
 * A pressed button here means "this source may send this type", which is why it
 * says so above the buttons: the ranking control below uses the same visual
 * pressed state for a different question, and a row showing both must not leave
 * the reader guessing which one they are answering.
 */
export function RoutingSourceSwitches({ dataType, toggles, onToggle }: Props) {
  const t = useTranslate("connections");
  const type = t(`dataTypes.${dataType}`);
  const label = t("routing.change.switches", { type });

  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-semibold text-ink-strong">{label}</p>
      <p className="text-[12px] text-ink-muted">
        {t("routing.change.switchesHint", { type })}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {toggles.map((toggle) => (
          <RoutingChoiceButton
            key={toggle.bridgeId}
            testId={`routing-route-${dataType}-${toggle.integrationId}`}
            selected={toggle.enabled}
            label={sourceName(toggle.integrationId)}
            onClick={() => onToggle(toggle.bridgeId, !toggle.enabled)}
          />
        ))}
      </div>
    </div>
  );
}
