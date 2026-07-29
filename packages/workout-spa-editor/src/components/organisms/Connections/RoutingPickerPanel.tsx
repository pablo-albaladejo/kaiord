import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeRouteToggle } from "../../../application/connections/data-type-route-toggles";
import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { canChooseSource } from "../../../application/connections/source-of-truth-options";
import { usePolicyToggle } from "../../../hooks/connections/use-policy-toggle";
import { useSourceOfTruthEditor } from "../../../hooks/connections/use-source-of-truth-editor";
import { useTranslate } from "../../../i18n/use-translate";
import { pickerIntro } from "./routing-change-copy";
import { RoutingSourceChoices } from "./RoutingSourceChoices";
import { RoutingSourceSwitches } from "./RoutingSourceSwitches";

type Props = {
  dataType: ManagedDataType;
  profileId: string;
  options: SourceOfTruthOptions;
  toggles: readonly DataTypeRouteToggle[];
};

/**
 * Both routing decisions, in the order they can be taken. Switching a source on
 * is what gives a type a source at all; ranking only applies once there are
 * several, so it is absent until there is something to rank rather than shown
 * as a control that cannot change what is read.
 */
export function RoutingPickerPanel({
  dataType,
  profileId,
  options,
  toggles,
}: Props) {
  const t = useTranslate("connections");
  const { pick, keepAll } = useSourceOfTruthEditor(profileId);
  const { setImportRoute } = usePolicyToggle();
  const type = t(`dataTypes.${dataType}`);

  return (
    <div
      data-testid={`routing-picker-${dataType}`}
      className="space-y-2 rounded-xl border border-edge-soft bg-surface-page p-3"
    >
      <p className="text-[12.5px] font-bold text-ink-strong">
        {t("routing.change.title", { type })}
      </p>
      {toggles.length > 0 && (
        <RoutingSourceSwitches
          dataType={dataType}
          toggles={toggles}
          onToggle={(bridgeId, enabled) => {
            void setImportRoute({ profileId, dataType, bridgeId, enabled });
          }}
        />
      )}
      {canChooseSource(options) && (
        <>
          {pickerIntro(options, type, t).map((line) => (
            <p key={line} className="text-[12px] text-ink-muted">
              {line}
            </p>
          ))}
          <RoutingSourceChoices
            dataType={dataType}
            options={options}
            onPick={(sourceId) => {
              void pick(dataType, options, sourceId);
            }}
            onKeepAll={() => {
              void keepAll(dataType);
            }}
          />
        </>
      )}
    </div>
  );
}
