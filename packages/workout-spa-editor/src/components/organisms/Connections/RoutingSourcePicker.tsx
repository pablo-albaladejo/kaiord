import type { ManagedDataType } from "@kaiord/core";
import { useState } from "react";

import type { DataTypeRouteToggle } from "../../../application/connections/data-type-route-toggles";
import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { useTranslate } from "../../../i18n/use-translate";
import { RoutingPickerPanel } from "./RoutingPickerPanel";

type Props = {
  dataType: ManagedDataType;
  profileId: string;
  options: SourceOfTruthOptions;
  toggles: readonly DataTypeRouteToggle[];
};

/**
 * The panel opens before it writes: the consequence of every control it holds
 * is on screen, in this row's own words, above the buttons that would cause it.
 * Nothing is stored by opening the control.
 */
export function RoutingSourcePicker({
  dataType,
  profileId,
  options,
  toggles,
}: Props) {
  const t = useTranslate("connections");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        data-testid={`routing-change-${dataType}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="self-start rounded-lg border border-edge px-2.5 py-1 text-[12px] font-semibold text-accent"
      >
        {open ? t("routing.change.close") : t("routing.change.open")}
      </button>
      {open && (
        <RoutingPickerPanel
          dataType={dataType}
          profileId={profileId}
          options={options}
          toggles={toggles}
        />
      )}
    </div>
  );
}
