import { useCurrentWorkout } from "../../../store/selectors";
import { stripIds } from "../../../store/strip-ids";
import { downloadBackup } from "../../../utils/backup-download";
import { StaleSchemaScreen } from "./StaleSchemaScreen";

/** The stale screen mid-session, offering the workout open in the editor. */
export const StaleSchemaMidSession = () => {
  const draft = useCurrentWorkout();
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
