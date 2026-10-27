import { useStaleSchema } from "../../../hooks/use-stale-schema";
import { useCurrentWorkout } from "../../../store/selectors";
import { stripIds } from "../../../store/strip-ids";
import { downloadBackup } from "../../../utils/backup-download";
import { StaleSchemaScreen } from "./StaleSchemaScreen";

/** Mid-session: another tab upgraded the database, so this one stops. */
export const StaleSchemaGate = () => {
  const stale = useStaleSchema();
  const draft = useCurrentWorkout();
  if (!stale) return null;
  return (
    <StaleSchemaScreen
      autoUpdate={false}
      hasDraft={draft !== null}
      onDownloadDraft={() => {
        if (draft) downloadBackup(stripIds(draft));
      }}
    />
  );
};
