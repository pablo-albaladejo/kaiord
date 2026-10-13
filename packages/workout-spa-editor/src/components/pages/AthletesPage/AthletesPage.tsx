import { useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useProfilesLive } from "../../../hooks/use-profiles-live";
import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { AthleteFileActions } from "./AthleteFileActions";
import { AthletesList } from "./AthletesList";
import { CreateAthleteForm } from "./CreateAthleteForm";
import { DeleteAthleteDialog } from "./DeleteAthleteDialog";
import { useProfileImportExport } from "./hooks/useProfileImportExport";

/* Every athlete in this browser, on a page rather than in a modal (P-15):
   create, rename, make active, import, export and delete. Each athlete's
   body and zones are edited on /athlete. */
export default function AthletesPage() {
  const t = useTranslate("athlete");
  const profiles = useProfilesLive() ?? [];
  const activeId = useActiveProfileLive()?.id ?? null;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const files = useProfileImportExport({ setImportError });
  const deleting = profiles.find((p) => p.id === deleteId) ?? null;

  return (
    <div
      className="mx-auto max-w-2xl space-y-6 p-4"
      data-testid="athletes-page"
    >
      <div className="space-y-1">
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-xl font-semibold text-ink-strong"
        >
          {t("athletes.title")}
        </h1>
        <p className="m-0 text-[13px] text-ink-muted">{t("athletes.intro")}</p>
      </div>
      <CreateAthleteForm />
      <AthletesList
        profiles={profiles}
        activeId={activeId}
        onExport={files.handleExport}
        onDelete={setDeleteId}
      />
      <AthleteFileActions onImport={files.handleImport} error={importError} />
      <DeleteAthleteDialog
        profile={deleting}
        onDone={() => setDeleteId(null)}
      />
    </div>
  );
}
