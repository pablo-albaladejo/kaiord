import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { ICON_MAP } from "../../atoms/Icon";

const DATA_PATH = "/settings/data";

type AthleteFileActionsProps = {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
};

/* Import one athlete's file. The line under it tells this file apart from
   the full backup, which lives in Settings (P-23). */
export function AthleteFileActions({
  onImport,
  error,
}: AthleteFileActionsProps) {
  const t = useTranslate("athlete");
  return (
    <div className="space-y-2">
      <label
        htmlFor="import-athlete"
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-strong hover:border-edge-strong focus-within:ring-2 focus-within:ring-accent"
      >
        <ICON_MAP.upload className="h-4 w-4" aria-hidden="true" />
        {t("athletes.import")}
        <input
          id="import-athlete"
          type="file"
          accept=".json,application/json"
          onChange={onImport}
          className="sr-only"
          aria-label={t("athletes.importFile")}
        />
      </label>
      <p className="m-0 text-[13px] text-ink-muted">
        {t("athletes.fileHint")}{" "}
        <Link
          href={DATA_PATH}
          className="font-medium text-ink-strong underline underline-offset-2"
        >
          {t("athletes.backupLink")}
        </Link>
      </p>
      {error && (
        <p
          role="alert"
          className="m-0 rounded-md bg-danger-bg p-3 text-sm text-danger-text"
        >
          {error}
        </p>
      )}
    </div>
  );
}
