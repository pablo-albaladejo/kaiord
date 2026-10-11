import { useCallback, useState } from "react";

import { importBackup } from "../../../application/backup/import-backup";
import {
  BackupFileError,
  parseBackup,
} from "../../../application/backup/parse-backup";
import type { BackupImportSummary } from "../../../application/backup/summarize-backup-import";
import type { ProfileChoice } from "../../../application/sync/reconcile-auto-profile";
import { useSnapshotSource } from "../../../contexts/sync-context";
import type { KaiordBackup } from "../../../types/backup";

export type ImportProblem =
  "invalid" | "unsupportedVersion" | "newerApp" | "failed";

export type ImportBackupState =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "choose"; backup: KaiordBackup; candidates: ProfileChoice[] }
  | { kind: "done"; summary: BackupImportSummary }
  | { kind: "error"; problem: ImportProblem };

const problemOf = (error: unknown): ImportProblem =>
  error instanceof BackupFileError ? error.reason : "failed";

/** Reads a backup file and merges it into this device (Settings → Privacy). */
export function useImportBackup() {
  const { snapshotPort, deviceId } = useSnapshotSource();
  const [state, setState] = useState<ImportBackupState>({ kind: "idle" });

  const run = useCallback(
    async (backup: KaiordBackup, choice: string | null) => {
      setState({ kind: "busy" });
      try {
        const result = await importBackup({
          port: snapshotPort,
          deviceId,
          backup,
          choice,
        });
        setState(
          result.kind === "needsChoice"
            ? { kind: "choose", backup, candidates: result.candidates }
            : { kind: "done", summary: result.summary }
        );
      } catch (error) {
        setState({ kind: "error", problem: problemOf(error) });
      }
    },
    [snapshotPort, deviceId]
  );

  const importFile = useCallback(
    async (file: File) => {
      setState({ kind: "busy" });
      try {
        await run(parseBackup(await file.text()), null);
      } catch (error) {
        setState({ kind: "error", problem: problemOf(error) });
      }
    },
    [run]
  );

  const choose = useCallback(
    (profileId: string) => {
      if (state.kind === "choose") void run(state.backup, profileId);
    },
    [state, run]
  );

  const cancel = useCallback(() => setState({ kind: "idle" }), []);

  return { state, importFile, choose, cancel };
}
