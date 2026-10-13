import { useTranslate } from "../../../i18n/use-translate";

export type WipeConfirmFieldProps = {
  word: string;
  value: string;
  onChange: (next: string) => void;
};

export const WipeConfirmField = ({
  word,
  value,
  onChange,
}: WipeConfirmFieldProps) => {
  const t = useTranslate("settings");

  return (
    <label className="block space-y-2 text-sm text-ink-strong">
      <span>{t("data.wipeDialog.typeLabel", { word })}</span>
      <input
        className="w-full rounded-lg border border-edge bg-surface p-2 text-sm text-ink-strong"
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        data-testid="wipe-confirm-input"
      />
    </label>
  );
};
