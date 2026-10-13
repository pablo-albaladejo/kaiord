import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { BackupImportSection } from "./BackupImportSection";
import { ClearApiKeysSection } from "./ClearApiKeysSection";
import { useExportBackup } from "./use-export-backup";
import { WipeAllDataSection } from "./WipeAllDataSection";

const HEADING_CLASS = "mb-3 text-sm font-semibold text-ink-body";

/** Backup in and out, the Drive copy, and deleting this browser's data. */
export const DataTab: React.FC = () => {
  const t = useTranslate("settings");
  const exportData = useExportBackup();

  return (
    <div className="space-y-6" data-testid="settings-data">
      <section>
        <h3 className={HEADING_CLASS}>{t("data.backup")}</h3>
        <Button variant="secondary" size="sm" onClick={exportData}>
          {t("privacy.exportData")}
        </Button>
        <p className="mb-4 mt-2 text-xs text-ink-muted">
          {t("privacy.exportHint")}
        </p>
        <BackupImportSection />
        <Link
          href="/settings/sync"
          className="text-sm text-ink-strong underline underline-offset-2 hover:text-ink-body"
        >
          {t("data.syncLink")}
        </Link>
      </section>
      <section className="space-y-4">
        <h3 className={HEADING_CLASS}>{t("data.dangerZone")}</h3>
        <ClearApiKeysSection />
        <WipeAllDataSection />
      </section>
    </div>
  );
};
