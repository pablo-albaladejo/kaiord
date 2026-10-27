import { useState } from "react";

import { useStaleSchema } from "../../../hooks/use-stale-schema";
import { useCurrentWorkout } from "../../../store/selectors";
import { stripIds } from "../../../store/strip-ids";
import { downloadBackup } from "../../../utils/backup-download";
import { StaleSchemaDialog } from "./StaleSchemaDialog";

/** Mid-session: another tab upgraded the database, so this one stops. */
export const StaleSchemaGate = () => {
  const stale = useStaleSchema();
  const draft = useCurrentWorkout();
  const [reloading, setReloading] = useState(false);
  if (!stale) return null;
  return (
    <StaleSchemaDialog
      hasDraft={draft !== null}
      tryAgainLater={false}
      reloading={reloading}
      onDownloadDraft={() => {
        if (draft) downloadBackup(stripIds(draft));
      }}
      onReload={() => {
        setReloading(true);
        window.location.reload();
      }}
    />
  );
};
