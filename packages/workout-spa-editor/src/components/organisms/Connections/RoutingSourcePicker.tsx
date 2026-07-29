import type { ManagedDataType } from "@kaiord/core";
import { useState } from "react";

import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { useSourceOfTruthEditor } from "../../../hooks/connections/use-source-of-truth-editor";
import { useTranslate } from "../../../i18n/use-translate";
import { pickerIntro } from "./routing-change-copy";
import { RoutingSourceChoices } from "./RoutingSourceChoices";

type Props = {
  dataType: ManagedDataType;
  profileId: string;
  options: SourceOfTruthOptions;
};

/**
 * The panel opens before it writes: the consequence of ranking is on screen,
 * in this row's own words, above the buttons that would cause it. Nothing is
 * stored by opening the control.
 */
export function RoutingSourcePicker({ dataType, profileId, options }: Props) {
  const t = useTranslate("connections");
  const [open, setOpen] = useState(false);
  const { pick, keepAll } = useSourceOfTruthEditor(profileId);
  const type = t(`dataTypes.${dataType}`);

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
        <div
          data-testid={`routing-picker-${dataType}`}
          className="space-y-2 rounded-xl border border-edge-soft bg-surface-page p-3"
        >
          <p className="text-[12.5px] font-bold text-ink-strong">
            {t("routing.change.title", { type })}
          </p>
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
        </div>
      )}
    </div>
  );
}
