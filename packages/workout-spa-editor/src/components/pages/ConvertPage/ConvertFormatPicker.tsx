import { useState } from "react";
import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import {
  CONVERT_SOURCES,
  CONVERT_TARGETS,
  convertHref,
  type ConvertPair,
} from "../../../routing/convert-params";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { sizeClasses, variantClasses } from "../../atoms/Button/button-styles";
import { formatLabel } from "./format-labels";

const SELECT_CLASS =
  "w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-ink-strong";

type FormatSelectProps = {
  id: string;
  label: string;
  value: WorkoutFileFormat;
  options: ReadonlyArray<WorkoutFileFormat>;
  onChange: (format: WorkoutFileFormat) => void;
};

function FormatSelect({
  id,
  label,
  value,
  options,
  onChange,
}: FormatSelectProps) {
  return (
    <label htmlFor={id} className="flex flex-1 flex-col gap-1 text-sm">
      <span className="font-medium text-ink-strong">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as WorkoutFileFormat)}
        className={SELECT_CLASS}
      >
        {options.map((format) => (
          <option key={format} value={format}>
            {formatLabel(format)}
          </option>
        ))}
      </select>
    </label>
  );
}

type ConvertFormatPickerProps = { initial?: Partial<ConvertPair> };

/**
 * Shown when the deep link carries no valid pair: pick one, then continue.
 * A side the link got right is kept.
 */
export function ConvertFormatPicker({
  initial = {},
}: ConvertFormatPickerProps) {
  const t = useTranslate("editor");
  const [from, setFrom] = useState<WorkoutFileFormat>(initial.from ?? "zwo");
  const [to, setTo] = useState<WorkoutFileFormat>(
    initial.to ?? (initial.from === "fit" ? "zwo" : "fit")
  );
  const valid = from !== to;

  return (
    <div className="flex flex-col gap-3" data-testid="convert-format-picker">
      <p className="m-0 text-sm text-ink-muted">{t("convert.pickerIntro")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <FormatSelect
          id="convert-from"
          label={t("convert.from")}
          value={from}
          options={CONVERT_SOURCES}
          onChange={setFrom}
        />
        <FormatSelect
          id="convert-to"
          label={t("convert.to")}
          value={to}
          options={CONVERT_TARGETS}
          onChange={setTo}
        />
      </div>
      {!valid && (
        <p
          className="m-0 text-sm text-ink-muted"
          data-testid="convert-same-format"
        >
          {t("convert.sameFormat")}
        </p>
      )}
      {valid && (
        <Link
          href={convertHref({ from, to })}
          className={`inline-flex items-center self-start rounded-lg font-semibold ${variantClasses.cta} ${sizeClasses.sm}`}
          data-testid="convert-continue"
        >
          {t("convert.continue")}
        </Link>
      )}
    </div>
  );
}
